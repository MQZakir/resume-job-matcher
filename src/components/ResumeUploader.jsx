import { useState, useRef, useCallback } from "react"
import { parseResume } from "../utils/parseResume"

const SECTION_META = {
  contact:        { color: "var(--blue)",  icon: "◉" },
  summary:        { color: "var(--lime)",  icon: "◈" },
  experience:     { color: "var(--teal)",  icon: "◆" },
  education:      { color: "var(--amber)", icon: "◆" },
  skills:         { color: "var(--lime)",  icon: "◆" },
  achievements:   { color: "var(--teal)",  icon: "◆" },
  projects:       { color: "var(--blue)",  icon: "◆" },
  certifications: { color: "var(--amber)", icon: "◆" },
  publications:   { color: "var(--blue)",  icon: "◆" },
  volunteering:   { color: "var(--teal)",  icon: "◆" },
  languages:      { color: "var(--lime)",  icon: "◆" },
  interests:      { color: "var(--dim)",   icon: "◇" },
  references:     { color: "var(--dim)",   icon: "◇" },
}

function getMeta(key) {
  if (SECTION_META[key]) return SECTION_META[key]
  return { color: "var(--blue)", icon: "◆" }
}

function SectionCard({ section, index }) {
  const meta = getMeta(section.key)
  const nonEmptyLines = section.lines.filter(l => l.trim())
  return (
    <div style={{
      borderLeft: `3px solid ${meta.color}`,
      background: "var(--bg)",
      padding: "18px 20px",
      animation: `fadeUp var(--dur-base) ${index * 45}ms var(--ease-spring) both`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ color: meta.color, fontSize: 13 }}>{meta.icon}</span>
        <span style={{ fontSize: 11, letterSpacing: ".14em", color: meta.color, textTransform: "uppercase", fontWeight: 500 }}>
          {section.label}
        </span>
        <span style={{ fontSize: 10, color: "var(--dim)", marginLeft: "auto" }}>
          {nonEmptyLines.length} lines
        </span>
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, lineHeight: 1.85, color: "var(--text)" }}>
        {section.lines.map((line, i) => (
          line.trim()
            ? <div key={i}>{line}</div>
            : <div key={i} style={{ height: 10 }} />
        ))}
      </div>
    </div>
  )
}

export function ResumeUploader({ onParsed, value = "", label = "YOUR RESUME", accentColor = "var(--lime30)" }) {
  const [status,   setStatus]   = useState(value ? "done" : "idle")
  const [fileInfo, setFileInfo] = useState(null)
  const [sections, setSections] = useState(null)
  const [stats,    setStats]    = useState(null)
  const [errMsg,   setErrMsg]   = useState("")
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const process = useCallback(async (file) => {
    setStatus("parsing")
    setErrMsg("")
    try {
      const result = await parseResume(file)
      setFileInfo({ name: result.fileName, size: result.fileSize })
      setSections(result.sections)
      setStats({ words: result.wordCount, chars: result.charCount, secs: result.sections.length })
      onParsed(result.text)
      setStatus("done")
    } catch (e) {
      setErrMsg(e.message || "Parse failed. Try a different file.")
      setStatus("error")
    }
  }, [onParsed])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) process(file)
  }, [process])

  const onInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) process(file)
    e.target.value = ""
  }

  const reset = () => {
    setStatus("idle"); setFileInfo(null); setSections(null)
    setStats(null); setErrMsg("")
    onParsed("")
  }

  if (status === "parsing") {
    return (
      <div style={{ border: "1px solid var(--line)", background: "var(--bg1)", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: "var(--lime)", animation: "pulse 1.5s ease-in-out infinite", marginBottom: 18 }}>
          READING FILE
        </div>
        <div className="dot-loader" style={{ justifyContent: "center", marginBottom: 12 }}>
          <span /><span /><span />
        </div>
        <div style={{ fontSize: 11, color: "var(--dim)", letterSpacing: ".1em" }}>EXTRACTING ALL TEXT</div>
      </div>
    )
  }

  if (status === "done" && sections) {
    return (
      <div>
        <div style={{
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          padding: "14px 18px",
          background: "var(--bg1)",
          border: "1px solid var(--line)",
          borderLeft: "3px solid var(--teal)",
          marginBottom: 1,
        }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "var(--teal)" }}>◈</span>
          <span style={{ fontSize: 13, color: "var(--text)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fileInfo?.name}
          </span>
          <span style={{ fontSize: 10, color: "var(--dim)" }}>{fileInfo?.size}</span>
          {stats && (
            <>
              <span style={{ width: 1, height: 14, background: "var(--line)", flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "var(--lime)" }}>{stats.words.toLocaleString()} words</span>
              <span style={{ fontSize: 10, color: "var(--dim)" }}>{stats.secs} sections</span>
            </>
          )}
          <button onClick={reset} className="btn-ghost" style={{ fontSize: 10, padding: "6px 14px", flexShrink: 0 }}>
            ✕ REMOVE
          </button>
        </div>

        <div style={{
          padding: "10px 18px",
          background: "var(--lime8)",
          border: "1px solid var(--lime15)",
          borderTop: "none",
          marginBottom: 1,
          fontSize: 11,
          color: "var(--lime)",
          letterSpacing: ".08em",
        }}>
          ◆ FULL RESUME PARSED — ALL TEXT BELOW IS SENT TO AI
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {sections.map((section, i) => (
            <SectionCard key={section.key + i} section={section} index={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: ".12em", color: "var(--dim)", marginBottom: 12, textTransform: "uppercase" }}>
        {label}
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `1px dashed ${dragging ? "var(--lime)" : status === "error" ? "var(--red)" : "var(--line2)"}`,
          borderLeft: `3px solid ${dragging ? "var(--lime)" : status === "error" ? "var(--red)" : accentColor}`,
          background: dragging ? "var(--lime8)" : "var(--bg)",
          padding: "clamp(36px, 6vw, 64px) 24px",
          cursor: "pointer",
          textAlign: "center",
          transition: "all var(--dur-base) var(--ease-out)",
        }}
      >
        <input ref={inputRef} type="file" accept=".pdf,.docx,.doc" onChange={onInputChange} style={{ display: "none" }} />
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(48px, 7vw, 72px)",
          color: dragging ? "var(--lime)" : "var(--dim2)",
          lineHeight: 1,
          marginBottom: 18,
          transition: "color var(--dur-fast) var(--ease-out)",
        }}>
          ⊡
        </div>
        <div style={{ fontSize: 16, color: dragging ? "var(--lime)" : "var(--text)", marginBottom: 8, letterSpacing: ".04em", transition: "color var(--dur-fast) var(--ease-out)" }}>
          {dragging ? "Drop it here" : "Drop your resume or click to browse"}
        </div>
        {status === "error" ? (
          <div style={{ fontSize: 13, color: "var(--red)", marginTop: 10 }}>✕ {errMsg}</div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--dim)", letterSpacing: ".06em" }}>
            PDF · DOCX · DOC — complete text extraction
          </div>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18 }}>
          {["PDF", "DOCX", "DOC"].map(t => (
            <span key={t} style={{ fontSize: 10, letterSpacing: ".1em", padding: "4px 12px", border: "1px solid var(--line2)", color: "var(--dim)" }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}