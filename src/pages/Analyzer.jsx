import { useState } from 'react'
import { callAI, parseJSON }  from '../utils/api'
import { Section }            from '../components/Section'
import { LoadingScreen }      from '../components/LoadingScreen'
import { AnimatedScore }      from '../components/AnimatedScore'
import { Chip }               from '../components/Chip'
import { ResumeUploader }     from '../components/ResumeUploader'

const SYSTEM = "You are an expert ATS and resume analyst with 15 years experience. Return only valid JSON."

function buildPrompt(text) {
  return `Analyze this resume comprehensively. Return ONLY valid JSON:
{
  "overallScore": 78, "atsScore": 72, "contentScore": 80, "formatScore": 75, "impactScore": 68,
  "name": "Candidate name", "currentRole": "Most recent role", "yearsExperience": "X years",
  "strengths": ["s1","s2","s3","s4"],
  "weaknesses": ["w1","w2","w3"],
  "missingKeywords": ["k1","k2","k3","k4","k5"],
  "presentKeywords": ["k1","k2","k3"],
  "sections": {
    "summary":      {"present":true,  "score":70, "feedback":"..."},
    "experience":   {"present":true,  "score":80, "feedback":"..."},
    "skills":       {"present":true,  "score":65, "feedback":"..."},
    "education":    {"present":true,  "score":75, "feedback":"..."},
    "achievements": {"present":false, "score":0,  "feedback":"Not found — add quantified achievements"},
    "contact":      {"present":true,  "score":90, "feedback":"..."}
  },
  "topRecommendations": ["r1","r2","r3","r4","r5"],
  "industryFit": ["Industry A","Industry B"],
  "redFlags": ["flag1","flag2"]
}
RESUME:\n${text}`
}

export function Analyzer({ resumeText, setResumeText, onAnalyze }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [localText, setLocalText] = useState(resumeText || '')

  const handleParsed = (text) => {
    setLocalText(text)
    setResumeText(text)
  }

  const runAnalysis = async () => {
    if (!localText.trim()) return
    setLoading(true)
    setAnalysis(null)
    try {
      const raw  = await callAI([{ role: 'user', content: buildPrompt(localText) }], SYSTEM)
      const data = parseJSON(raw)
      setAnalysis(data)
      onAnalyze(data.atsScore)
    } catch {
      alert('Analysis failed — please try again.')
    }
    setLoading(false)
  }

  if (loading) return <Section num="02"><LoadingScreen text="ANALYZING" /></Section>

  return (
    <Section num="02">
      <div className="page-wrap">

        <div className="anim-up" style={{ marginBottom: 'clamp(18px,2.5vw,30px)' }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(32px,4.5vw,52px)', letterSpacing: '.02em', marginBottom: 6 }}>
            RESUME ANALYZER
          </div>
          <p style={{ fontSize: 'clamp(11px,1.1vw,13px)', color: 'var(--dim)', lineHeight: 1.7, maxWidth: 560 }}>
            Upload your resume — PDF or DOCX — for a full ATS audit, section-by-section scoring, and keyword analysis.
          </p>
        </div>

        {!analysis ? (
          <div className="anim-up d1" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div className="cell">
              <ResumeUploader
                onParsed={handleParsed}
                value={localText}
                label="YOUR RESUME — PDF OR DOCX"
                accentColor="var(--lime30)"
              />
            </div>

            <button
              className="btn-lime"
              onClick={runAnalysis}
              disabled={!localText.trim()}
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 12, letterSpacing: '.12em' }}
            >
              RUN FULL ANALYSIS →
            </button>
          </div>
        ) : (
          <Results
            analysis={analysis}
            onReset={() => { setAnalysis(null); setLocalText(''); setResumeText('') }}
          />
        )}
      </div>
    </Section>
  )
}

/* ─── RESULTS ────────────────────────────────────────────────────────────── */
function Results({ analysis, onReset }) {
  const scores = [
    { l: 'OVERALL',  v: analysis.overallScore,  c: analysis.overallScore  >= 75 ? 'var(--teal)' : analysis.overallScore  >= 50 ? 'var(--lime)' : 'var(--red)' },
    { l: 'ATS PASS', v: analysis.atsScore,       c: analysis.atsScore      >= 75 ? 'var(--teal)' : analysis.atsScore      >= 50 ? 'var(--lime)' : 'var(--red)' },
    { l: 'CONTENT',  v: analysis.contentScore,   c: 'var(--lime)'  },
    { l: 'FORMAT',   v: analysis.formatScore,    c: 'var(--blue)'  },
    { l: 'IMPACT',   v: analysis.impactScore,    c: 'var(--amber)' },
  ]

  return (
    <div className="anim-up">
      {/* Score row */}
      <div className="rf-grid-5" style={{ marginBottom: 1 }}>
        {scores.map(s => (
          <div key={s.l} className="cell" style={{ textAlign: 'center', padding: 'clamp(14px,2vw,22px)' }}>
            <AnimatedScore value={s.v} label={s.l} color={s.c} size="clamp(32px,4vw,48px)" />
          </div>
        ))}
      </div>

      {/* Candidate strip */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', padding: '11px 18px', background: 'var(--bg1)', border: '1px solid var(--line)', borderTop: 'none', marginBottom: 'clamp(16px,2vw,26px)', animation: 'fadeUp var(--dur-base) 60ms var(--ease-spring) both' }}>
        {analysis.name            && <span style={{ fontSize: 11 }}>{analysis.name}</span>}
        {analysis.currentRole     && <span style={{ fontSize: 11, color: 'var(--dim)' }}>— {analysis.currentRole}</span>}
        {analysis.yearsExperience && <span style={{ fontSize: 11, color: 'var(--lime)' }}>{analysis.yearsExperience}</span>}
        {analysis.industryFit?.map(i => <Chip key={i} text={i} color="var(--blue)" />)}
      </div>

      <div className="rf-grid-2" style={{ marginBottom: 2 }}>
        {/* Section audit */}
        <div className="cell anim-left" style={{ animationDelay: '80ms' }}>
          <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--dim)', marginBottom: 16 }}>SECTION AUDIT</div>
          {Object.entries(analysis.sections || {}).map(([key, s], i) => (
            <div key={key} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--line)', animation: `fadeUp var(--dur-base) ${i * 50}ms var(--ease-spring) both` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: s.present ? 'var(--text)' : 'var(--red)' }}>
                  {s.present ? '◆' : '✕'} {key}
                </span>
                <span style={{ fontSize: 11, fontFamily: "'Bebas Neue'", color: s.score >= 75 ? 'var(--teal)' : s.score >= 50 ? 'var(--lime)' : 'var(--red)' }}>
                  {s.score}/100
                </span>
              </div>
              <div className="bar-wrap" style={{ marginBottom: 6 }}>
                <div className="bar-fill" style={{ width: `${s.score}%`, background: s.score >= 75 ? 'var(--teal)' : s.score >= 50 ? 'var(--lime)' : 'var(--red)', transitionDelay: `${i * 80}ms` }} />
              </div>
              <div style={{ fontSize: 'clamp(10px,1vw,12px)', color: 'var(--dim)', lineHeight: 1.6 }}>{s.feedback}</div>
            </div>
          ))}
        </div>

        {/* Right insights */}
        <div className="anim-right" style={{ display: 'flex', flexDirection: 'column', gap: 1, animationDelay: '80ms' }}>
          <div className="cell">
            <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--teal)', marginBottom: 12 }}>◆ STRENGTHS</div>
            {analysis.strengths?.map((s, i) => (
              <div key={i} style={{ fontSize: 'clamp(11px,1vw,13px)', lineHeight: 1.6, marginBottom: 8, borderLeft: '2px solid var(--teal)', paddingLeft: 10, animation: `fadeUp var(--dur-base) ${i * 60}ms var(--ease-spring) both` }}>{s}</div>
            ))}
          </div>

          <div className="cell">
            <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--red)', marginBottom: 12 }}>✕ WEAKNESSES</div>
            {analysis.weaknesses?.map((w, i) => (
              <div key={i} style={{ fontSize: 'clamp(11px,1vw,13px)', lineHeight: 1.6, marginBottom: 8, borderLeft: '2px solid var(--red)', paddingLeft: 10, animation: `fadeUp var(--dur-base) ${i * 60}ms var(--ease-spring) both` }}>{w}</div>
            ))}
          </div>

          {analysis.redFlags?.length > 0 && (
            <div className="cell" style={{ background: 'rgba(255,77,109,.04)', borderColor: 'rgba(255,77,109,.2)' }}>
              <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--red)', marginBottom: 12 }}>⚠ RED FLAGS</div>
              {analysis.redFlags.map((r, i) => (
                <div key={i} style={{ fontSize: 'clamp(11px,1vw,13px)', lineHeight: 1.6, marginBottom: 6, color: 'var(--dim)' }}>{r}</div>
              ))}
            </div>
          )}

          <div className="cell">
            <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--dim)', marginBottom: 10 }}>KEYWORDS PRESENT</div>
            <div style={{ marginBottom: 16 }}>
              {analysis.presentKeywords?.map((k, i) => <Chip key={k} text={k} color="var(--teal)" delay={`${i * 40}ms`} />)}
            </div>
            <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--dim)', marginBottom: 10 }}>MISSING — ADD THESE</div>
            {analysis.missingKeywords?.map((k, i) => <Chip key={k} text={k} color="var(--red)" delay={`${i * 40}ms`} />)}
          </div>

          <div className="cell" style={{ background: 'var(--lime8)', borderColor: 'var(--lime30)' }}>
            <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--lime)', marginBottom: 12 }}>◆ TOP RECOMMENDATIONS</div>
            {analysis.topRecommendations?.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: 'clamp(11px,1vw,13px)', lineHeight: 1.6, marginBottom: 10, animation: `fadeUp var(--dur-base) ${i * 50}ms var(--ease-spring) both` }}>
                <span style={{ fontFamily: "'Bebas Neue'", fontSize: 13, color: 'var(--lime)', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="btn-ghost" onClick={onReset} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
        ↺ UPLOAD A DIFFERENT RESUME
      </button>
    </div>
  )
}