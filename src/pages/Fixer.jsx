import { useState } from 'react'
import { callAI, parseJSON } from '../utils/api'
import { Section }           from '../components/Section'
import { LoadingScreen }     from '../components/LoadingScreen'
import { AnimatedScore }     from '../components/AnimatedScore'
import { ResumeUploader }    from '../components/ResumeUploader'

const SECTIONS = [
  { id: 'summary',      label: 'Professional Summary'    },
  { id: 'experience',   label: 'Work Experience Bullets' },
  { id: 'skills',       label: 'Skills Section'           },
  { id: 'achievements', label: 'Achievements'             },
  { id: 'full',         label: 'Full Resume Rewrite'      },
]

const SYSTEM = "You are an elite resume writer. Rewrite powerfully. Return only valid JSON."

function buildPrompt(resume, section, jobRole, tone) {
  const secLabel = SECTIONS.find(s => s.id === section)?.label
  return `Rewrite the "${secLabel}" section of this resume.
${jobRole ? `Target role: ${jobRole}` : ''}
Tone: ${tone}
Return ONLY valid JSON:
{
  "sectionName": "${secLabel}",
  "original": "extracted original section text",
  "rewritten": "powerful, ATS-optimized full rewrite",
  "keyImprovements": ["i1","i2","i3","i4"],
  "beforeScore": 55,
  "afterScore": 88,
  "bonusTip": "one advanced tip for this section",
  "alternateVersion": "slightly different rewrite with a different angle"
}
RESUME:\n${resume}`
}

export function Fixer({ resumeText, setResumeText, onFix }) {
  const [localResume, setLR]  = useState(resumeText || '')
  const [section, setSection] = useState('summary')
  const [jobRole, setJobRole] = useState('')
  const [tone, setTone]       = useState('professional')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(null)

  const handleParsed = (text) => {
    setLR(text)
    setResumeText(text)
  }

  const run = async () => {
    if (!localResume.trim()) return
    setLoading(true); setResult(null)
    try {
      const raw = await callAI([{ role: 'user', content: buildPrompt(localResume, section, jobRole, tone) }], SYSTEM)
      setResult(parseJSON(raw))
      onFix()
    } catch { alert('Rewrite failed — please try again.') }
    setLoading(false)
  }

  const copy = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopied(idx)
    setTimeout(() => setCopied(null), 1800)
  }

  if (loading) return <Section num="04"><LoadingScreen text="REWRITING" /></Section>

  return (
    <Section num="04">
      <div className="page-wrap">

        <div className="anim-up" style={{ marginBottom: 'clamp(18px,2.5vw,30px)' }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(32px,4.5vw,52px)', letterSpacing: '.02em', marginBottom: 6 }}>RESUME FIXER</div>
          <p style={{ fontSize: 'clamp(11px,1.1vw,13px)', color: 'var(--dim)', lineHeight: 1.7, maxWidth: 560 }}>
            Upload your resume, pick a section — AI rewrites it to be stronger, more impactful, and ATS-optimized.
          </p>
        </div>

        {!result ? (
          <div className="anim-up d1" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Upload */}
            <div className="cell">
              <ResumeUploader
                onParsed={handleParsed}
                value={localResume}
                label="YOUR RESUME — PDF OR DOCX"
                accentColor="rgba(255,179,71,.3)"
              />
            </div>

            {/* Config row */}
            <div className="rf-grid-3">
              {/* Section picker */}
              <div className="cell">
                <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--dim)', marginBottom: 10 }}>SECTION TO FIX</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {SECTIONS.map(s => (
                    <button key={s.id} onClick={() => setSection(s.id)} style={{
                      padding: '9px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
                      fontFamily: "'DM Mono'", fontSize: 11, letterSpacing: '.06em',
                      background: section === s.id ? 'var(--lime8)' : 'var(--bg2)',
                      color:      section === s.id ? 'var(--lime)'  : 'var(--dim)',
                      borderLeft: `2px solid ${section === s.id ? 'var(--lime)' : 'transparent'}`,
                      transition: 'all var(--dur-fast) var(--ease-out)',
                    }}>
                      {section === s.id ? '◆ ' : '◇ '}{s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="cell" style={{ borderLeft: 'none' }}>
                <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--dim)', marginBottom: 10 }}>TARGET ROLE (OPTIONAL)</div>
                <input value={jobRole} onChange={e => setJobRole(e.target.value)}
                  placeholder="e.g. Senior PM at Google" style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--dim)', marginBottom: 10 }}>WRITING TONE</div>
                <select value={tone} onChange={e => setTone(e.target.value)}>
                  {['professional','confident','data-driven','creative','executive','startup'].map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Info */}
              <div className="cell" style={{ borderLeft: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(28px,4vw,48px)', color: 'var(--dim)' }}>⊕</div>
                <div style={{ fontSize: 'clamp(10px,1vw,12px)', color: 'var(--dim)', lineHeight: 1.65 }}>
                  AI rewrites the selected section to maximize impact and ATS performance
                </div>
              </div>
            </div>

            <button className="btn-lime" onClick={run} disabled={!localResume.trim()}
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 12, letterSpacing: '.12em' }}>
              FIX WITH AI →
            </button>
          </div>
        ) : (
          <FixResult result={result} copied={copied} onCopy={copy} onReset={() => { setResult(null); setLR(''); setResumeText('') }} />
        )}
      </div>
    </Section>
  )
}

function FixResult({ result, copied, onCopy, onReset }) {
  const delta = result.afterScore - result.beforeScore
  return (
    <div className="anim-up">
      {/* Score delta */}
      <div className="rf-grid-3" style={{ marginBottom: 1 }}>
        <div className="cell" style={{ textAlign: 'center', padding: 'clamp(14px,2vw,22px)' }}>
          <AnimatedScore value={result.beforeScore} label="BEFORE" color="var(--red)" size="clamp(32px,4vw,46px)" />
        </div>
        <div className="cell" style={{ textAlign: 'center', padding: 'clamp(14px,2vw,22px)', background: 'var(--lime8)', borderColor: 'var(--lime30)' }}>
          <AnimatedScore value={delta} label="IMPROVEMENT" color="var(--lime)" size="clamp(32px,4vw,46px)" />
        </div>
        <div className="cell" style={{ textAlign: 'center', padding: 'clamp(14px,2vw,22px)' }}>
          <AnimatedScore value={result.afterScore} label="AFTER" color="var(--teal)" size="clamp(32px,4vw,46px)" />
        </div>
      </div>

      {/* Before / After */}
      <div className="rf-grid-2" style={{ marginBottom: 1 }}>
        <div className="cell anim-left" style={{ animationDelay: '60ms' }}>
          <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--red)', marginBottom: 12 }}>✕ ORIGINAL</div>
          <p style={{ fontFamily: "'Instrument Serif',serif", fontSize: 'clamp(13px,1.3vw,16px)', lineHeight: 1.85, color: 'var(--dim)', fontStyle: 'italic' }}>
            {result.original}
          </p>
        </div>
        <div className="cell anim-right" style={{ borderLeft: 'none', borderTop: '2px solid var(--lime)', background: 'var(--lime8)', animationDelay: '60ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--lime)' }}>◆ REWRITTEN</div>
            <button className="btn-ghost" onClick={() => onCopy(result.rewritten, 0)} style={{ fontSize: 9, padding: '4px 10px' }}>
              {copied === 0 ? 'COPIED ✓' : 'COPY'}
            </button>
          </div>
          <p style={{ fontFamily: "'Instrument Serif',serif", fontSize: 'clamp(13px,1.3vw,17px)', lineHeight: 1.85 }}>
            {result.rewritten}
          </p>
        </div>
      </div>

      {/* Improvements + Alt */}
      <div className="rf-grid-2" style={{ marginBottom: 2 }}>
        <div className="cell anim-left" style={{ animationDelay: '100ms' }}>
          <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--dim)', marginBottom: 12 }}>KEY IMPROVEMENTS MADE</div>
          {result.keyImprovements?.map((k, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, fontSize: 'clamp(11px,1vw,13px)', lineHeight: 1.6, marginBottom: 9, animation: `fadeUp var(--dur-base) ${i * 55}ms var(--ease-spring) both` }}>
              <span style={{ color: 'var(--lime)', flexShrink: 0, fontSize: 10 }}>◆</span>{k}
            </div>
          ))}
          {result.bonusTip && (
            <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14, fontSize: 'clamp(11px,1vw,13px)', color: 'var(--dim)', borderLeft: '2px solid var(--amber)', paddingLeft: 10 }}>
              <span style={{ fontSize: 9, color: 'var(--amber)', letterSpacing: '.1em', display: 'block', marginBottom: 4 }}>△ ADVANCED TIP</span>
              {result.bonusTip}
            </div>
          )}
        </div>
        <div className="cell anim-right" style={{ borderLeft: 'none', animationDelay: '100ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--blue)' }}>◈ ALTERNATIVE VERSION</div>
            <button className="btn-ghost" onClick={() => onCopy(result.alternateVersion, 1)} style={{ fontSize: 9, padding: '4px 10px' }}>
              {copied === 1 ? 'COPIED ✓' : 'COPY'}
            </button>
          </div>
          <p style={{ fontFamily: "'Instrument Serif',serif", fontSize: 'clamp(13px,1.3vw,16px)', lineHeight: 1.85, color: 'var(--dim)' }}>
            {result.alternateVersion}
          </p>
        </div>
      </div>

      <button className="btn-ghost" onClick={onReset} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
        ↺ UPLOAD A DIFFERENT RESUME
      </button>
    </div>
  )
}