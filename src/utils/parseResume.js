/**
 * parseResume.js
 * ─────────────
 * Extracts plain text from PDF and DOCX files in the browser.
 *
 * PDF  → pdfjs-dist  (renders each page's text content)
 * DOCX → mammoth     (converts Word XML → plain text)
 *
 * Returns: { text: string, sections: object }
 * where sections is a best-effort parse of the major resume blocks.
 */

// ─── PDF ─────────────────────────────────────────────────────────────────────

async function extractPDF(file) {
  const pdfjsLib = await import('pdfjs-dist')

  // Point the worker at the CDN so Vite doesn't need to bundle it
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map(item => item.str).join(' ')
    fullText += pageText + '\n'
  }

  return fullText.trim()
}

// ─── DOCX ─────────────────────────────────────────────────────────────────────

async function extractDOCX(file) {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value.trim()
}

// ─── SECTION PARSER ───────────────────────────────────────────────────────────

/**
 * Heuristically split plain resume text into labelled sections.
 * Returns { contact, summary, experience, education, skills, other }
 */
function parseSections(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  const SECTION_HEADINGS = {
    summary:    /^(summary|profile|objective|about|professional summary)/i,
    experience: /^(experience|work experience|employment|career|work history)/i,
    education:  /^(education|academic|qualifications|degrees?|schooling)/i,
    skills:     /^(skills?|technical skills?|competencies|expertise|technologies)/i,
    achievements: /^(achievements?|awards?|honors?|accomplishments?|projects?|publications?)/i,
  }

  const sections = {
    contact:      '',
    summary:      '',
    experience:   '',
    education:    '',
    skills:       '',
    achievements: '',
    other:        '',
  }

  // First 6 non-empty lines are likely contact info
  sections.contact = lines.slice(0, 6).join('\n')

  let currentSection = 'other'
  const bodyLines = lines.slice(6)

  bodyLines.forEach(line => {
    let matched = false
    for (const [key, regex] of Object.entries(SECTION_HEADINGS)) {
      if (regex.test(line) && line.length < 50) {
        currentSection = key
        matched = true
        break
      }
    }
    if (!matched) {
      sections[currentSection] += line + '\n'
    }
  })

  // Trim each section
  Object.keys(sections).forEach(k => {
    sections[k] = sections[k].trim()
  })

  return sections
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * @param {File} file  — a PDF or DOCX File object
 * @returns {Promise<{ text: string, sections: object, fileName: string, fileSize: string }>}
 */
export async function parseResume(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  let text = ''

  if (ext === 'pdf') {
    text = await extractPDF(file)
  } else if (ext === 'docx' || ext === 'doc') {
    text = await extractDOCX(file)
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.')
  }

  if (!text || text.length < 50) {
    throw new Error('Could not extract text from this file. Try a different format.')
  }

  const sections  = parseSections(text)
  const fileSizeKB = (file.size / 1024).toFixed(0)
  const fileSize  = fileSizeKB > 1024
    ? `${(fileSizeKB / 1024).toFixed(1)} MB`
    : `${fileSizeKB} KB`

  return { text, sections, fileName: file.name, fileSize }
}