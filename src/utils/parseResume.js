/**
 * parseResume.js -- Full-fidelity resume extraction for REZIQ
 * PDF  -> pdfjs-dist (reconstructs visual lines from Y-position grouping)
 * DOCX -> mammoth    (paragraph-level plain text)
 * 100% of text is preserved. Nothing is truncated.
 */

// PDF extraction -- groups text items by visual line using Y coords
async function extractPDF(file) {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pageTexts = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page    = await pdf.getPage(p);
    const content = await page.getTextContent();

    // Group items by Y position (bucket 2px) to reconstruct visual lines
    const yMap = new Map();
    for (const item of content.items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5] / 2) * 2;
      if (!yMap.has(y)) yMap.set(y, []);
      yMap.get(y).push({ x: item.transform[4], str: item.str });
    }

    // Sort top-to-bottom (PDF y=0 is page bottom, so descending)
    const rows = [...yMap.keys()]
      .sort((a, b) => b - a)
      .map(y =>
        yMap.get(y)
          .sort((a, b) => a.x - b.x)
          .map(i => i.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean);

    if (rows.length) pageTexts.push(rows.join("\n"));
  }

  return pageTexts.join("\n\n").trim();
}

// DOCX extraction -- mammoth paragraph-level plain text
async function extractDOCX(file) {
  const mammoth = await import("mammoth");
  const buf     = await file.arrayBuffer();
  const result  = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value
    .split("\n")
    .map(l => l.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Known section heading patterns (ordered, most specific first)
const HEADING_MAP = [
  { key: "contact",        label: "Contact Information",   re: /^(contact( info(rmation)?)?|personal details?|personal info|reach me|get in touch)$/i },
  { key: "summary",        label: "Professional Summary",  re: /^(summary|professional summary|career summary|executive summary|profile|objective|career objective|about me|personal statement|overview|who i am)$/i },
  { key: "experience",     label: "Work Experience",       re: /^(experience|work experience|employment|employment history|career|career history|work history|professional experience|positions? held|job history|relevant experience|related experience)$/i },
  { key: "education",      label: "Education",             re: /^(education|academic(s| background| history)?|qualifications?|degrees?|schooling|educational background|academic qualifications?)$/i },
  { key: "skills",         label: "Skills",                re: /^(skills?|technical skills?|core skills?|key skills?|competenc(y|ies)|expertise|technologies|tools?|proficiencies|technical proficiencies|areas? of expertise|skill set)$/i },
  { key: "achievements",   label: "Achievements and Awards", re: /^(achievements?|awards?|honors?|honours?|accomplishments?|recognition|accolades|key achievements?)$/i },
  { key: "projects",       label: "Projects",              re: /^(projects?|personal projects?|side projects?|portfolio|notable projects?|key projects?|selected projects?)$/i },
  { key: "certifications", label: "Certifications",        re: /^(certifications?|certificates?|credentials?|licenses?|accreditations?|professional certifications?)$/i },
  { key: "publications",   label: "Publications",          re: /^(publications?|papers?|research|conference presentations?|academic papers?)$/i },
  { key: "volunteering",   label: "Volunteering",          re: /^(volunteering?|volunteer( work)?|community( service)?|civic|giving back)$/i },
  { key: "languages",      label: "Languages",             re: /^(languages?|spoken languages?|linguistic skills?)$/i },
  { key: "interests",      label: "Interests and Hobbies", re: /^(interests?|hobbies|activities|extracurricular|passions?|personal interests?)$/i },
  { key: "references",     label: "References",            re: /^(references?|referees?|professional references?)$/i },
];

function detectHeading(line) {
  const t = line.trim();
  if (!t || t.length > 70) return null;

  for (const { key, label, re } of HEADING_MAP) {
    if (re.test(t)) return { key, label };
  }

  // All-caps short lines (1-5 words) = custom section heading
  const isAllCaps = t === t.toUpperCase() && /[A-Z]{2,}/.test(t) && t.length <= 50;
  if (isAllCaps) {
    const wordCount = t.trim().split(/\s+/).length;
    if (wordCount >= 1 && wordCount <= 5) {
      const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
      return { key: `custom_${slug}`, label: t.trim() };
    }
  }

  return null;
}

// Split raw text into ordered sections
function parseSections(text) {
  const rawLines = text.split("\n");
  const sections = [];
  let cur = { key: "contact", label: "Contact Information", heading: "", lines: [] };

  for (const raw of rawLines) {
    const h = detectHeading(raw);
    if (h) {
      if (cur.lines.some(l => l.trim())) sections.push({ ...cur });
      cur = { key: h.key, label: h.label, heading: raw.trim(), lines: [] };
    } else {
      cur.lines.push(raw);
    }
  }
  if (cur.lines.some(l => l.trim())) sections.push({ ...cur });

  return sections
    .filter(s => s.lines.some(l => l.trim().length > 0))
    .map(s => ({ ...s, rawText: s.lines.join("\n").trim() }));
}

// Public API
export async function parseResume(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  let text = "";

  if (ext === "pdf") {
    text = await extractPDF(file);
  } else if (ext === "docx" || ext === "doc") {
    text = await extractDOCX(file);
  } else {
    throw new Error("Unsupported format. Please upload a PDF or DOCX file.");
  }

  if (!text || text.length < 30) {
    throw new Error("No readable text found. The file may be image-only. Try a text-based PDF or DOCX.");
  }

  const sections  = parseSections(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const charCount = text.length;
  const sizeKB    = Math.round(file.size / 1024);
  const fileSize  = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

  return { text, sections, fileName: file.name, fileSize, wordCount, charCount };
}