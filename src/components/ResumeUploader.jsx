/**
 * ResumeUploader.jsx
 * ──────────────────
 * Drop zone + file picker for PDF/DOCX resumes.
 * After parse it shows a structured preview of the extracted text.
 *
 * Props:
 *   onParsed(text: string)  — called with the raw extracted text
 *   value(string)           — current resume text (shows loaded state)
 *   label(string)           — heading override, default "YOUR RESUME"
 *   accentColor(string)     — left-border accent, default 'var(--lime30)'
 */

import { useState, useRef, useCallback } from 'react'
import { parseResume } from '../utils/parseResume'

const ACCEPTED = '.pdf,.docx,.doc'

// ─── SECTION PREVIEW CARD ─────────────────────────────────────────────────────
function SectionBlock({ title, content, color = 'var(--dim)', delay = '0ms' }) {
  const [expanded, setExpanded] = useState(false)
  if (!content) return null

  const preview  = content.split('\n').slice(0, 3).join('\n')
  const hasMore  = content.split('\n').length > 3
  const shown    = expanded ? content : preview

  return (
    <div
      style={{
        borderLeft: `2px solid ${color}`,
        paddingLeft: 12,
        marginBottom: 14,
        animation: `fadeUp var(--dur-base) ${delay} var(--ease-spring) both`,
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: '.12em', color, textTransform: 'uppercase', marginBottom: 5 }}>
        {title}
      </div>
      <p style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {shown}
      </p>
      {hasMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 9, color, letterSpacing: '.1em', marginTop: 5, padding: 0,
            textTransform: 'uppercase',
          }}
        >
          {expanded ? '▲ COLLAPSE' : '▼ SHOW MORE'}
        </button>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function ResumeUploader({
  onParsed,
  value = '',
  label = 'YOUR RESUME',
  accentColor = 'var(--lime30)',
}) {
  const [status, setStatus]     = useState('idle')   // idle | parsing | done | error
  const [fileInfo, setFileInfo] = useState(null)      // { fileName, fileSize }
  const [sections, setSections] = useState(null)      // parsed sections object
  const [errMsg, setErrMsg]     = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const process = useCallback(async (file) => {
    if (!file) return
    setStatus('parsing')
    setErrMsg('')
    try {
      const result = await parseResume(file)
      setFileInfo({ fileName: result.fileName, fileSize: result.fileSize })
      setSections(result.sections)
      onParsed(result.text)
      setStatus('done')
    } catch (e) {
      setErrMsg(e.message || 'Parse failed. Please try a different file.')
      setStatus('error')
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
    e.target.value = ''
  }

  const reset = () => {
    setStatus('idle')
    setFileInfo(null)
    setSections(null)
    setErrMsg('')
    onParsed('')
  }

  const SECTION_DEFS = [
    { key: 'contact',      title: 'Contact Info',   color: 'var(--lime)',  delay: '0ms'   },
    { key: 'summary',      title: 'Summary',        color: 'var(--teal)', delay: '40ms'  },
    { key: 'experience',   title: 'Experience',     color: 'var(--blue)', delay: '80ms'  },
    { key: 'education',    title: 'Education',      color: 'var(--amber)',delay: '120ms' },
    { key: 'skills',       title: 'Skills',         color: 'var(--lime)', delay: '160ms' },
    { key: 'achievements', title: 'Achievements',   color: 'var(--teal)', delay: '200ms' },
  ]

  // ── IDLE / ERROR drop zone ────────────────────────────────────────────────
  if (status === 'idle' || status === 'error') {
    return (
      <div>
        <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--dim)', marginBottom: 10 }}>
          {label}
        </div>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            border: `1px dashed ${dragging ? 'var(--lime)' : 'var(--line2)'}`,
            borderLeft: `3px solid ${dragging ? 'var(--lime)' : accentColor}`,
            background: dragging ? 'var(--lime8)' : 'var(--bg)',
            padding: 'clamp(28px, 5vw, 52px) 24px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all var(--dur-base) var(--ease-out)',
            position: 'relative',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            onChange={onInputChange}
            style={{ display: 'none' }}
          />

          {/* Icon */}
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(36px, 6vw, 56px)',
            color: dragging ? 'var(--lime)' : 'var(--dim2)',
            lineHeight: 1,
            marginBottom: 14,
            transition: 'color var(--dur-fast) var(--ease-out)',
          }}>
            ⊡
          </div>

          <div style={{ fontSize: 13, color: dragging ? 'var(--lime)' : 'var(--text)', marginBottom: 6, transition: 'color var(--dur-fast) var(--ease-out)' }}>
            {dragging ? 'Drop it here' : 'Drop your resume or click to browse'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: '.08em' }}>
            PDF · DOCX · DOC
          </div>

          {status === 'error' && (
            <div style={{ marginTop: 16, fontSize: 11, color: 'var(--red)', letterSpacing: '.04em' }}>
              ✕ {errMsg}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── PARSING ───────────────────────────────────────────────────────────────
  if (status === 'parsing') {
    return (
      <div>
        <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--dim)', marginBottom: 10 }}>{label}</div>
        <div style={{ border: '1px solid var(--line)', background: 'var(--bg1)', padding: '32px 24px', textAlign: 'center' }}>
          <div className="dot-loader" style={{ justifyContent: 'center', marginBottom: 14 }}>
            <span /><span /><span />
          </div>
          <div style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: '.12em' }}>PARSING FILE…</div>
        </div>
      </div>
    )
  }

  // ── DONE — preview ────────────────────────────────────────────────────────
  return (
    <div>
      {/* File info strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--dim)', flex: 1 }}>{label}</div>
        <div style={{ fontSize: 9, color: 'var(--teal)', letterSpacing: '.08em' }}>
          ◆ {fileInfo?.fileName}
        </div>
        <div style={{ fontSize: 9, color: 'var(--dim)' }}>{fileInfo?.fileSize}</div>
        <button
          onClick={reset}
          style={{
            background: 'none', border: '1px solid var(--line2)',
            color: 'var(--dim)', cursor: 'pointer', fontSize: 9,
            letterSpacing: '.1em', padding: '3px 9px',
            transition: 'all var(--dur-fast) var(--ease-out)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--dim)'; e.currentTarget.style.borderColor = 'var(--line2)' }}
        >
          ✕ REMOVE
        </button>
      </div>

      {/* Parsed sections preview */}
      <div style={{
        border: '1px solid var(--line)',
        borderLeft: `3px solid ${accentColor.replace('30', '')}`,
        background: 'var(--bg1)',
        padding: 'clamp(14px, 2vw, 22px)',
        maxHeight: 'clamp(240px, 32vh, 400px)',
        overflowY: 'auto',
      }}>
        <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--lime)', marginBottom: 14 }}>
          ◆ PARSED SUCCESSFULLY — REVIEW BELOW
        </div>

        {SECTION_DEFS.map(def => (
          <SectionBlock
            key={def.key}
            title={def.title}
            content={sections?.[def.key]}
            color={def.color}
            delay={def.delay}
          />
        ))}

        {/* Any leftover */}
        {sections?.other && (
          <SectionBlock title="Other" content={sections.other} color="var(--dim)" delay="240ms" />
        )}
      </div>
    </div>
  )
}