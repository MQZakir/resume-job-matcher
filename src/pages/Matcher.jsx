import { useState } from 'react'
import { callAI, parseJSON }  from '../utils/api'
import { Section }            from '../components/Section'
import { LoadingScreen }      from '../components/LoadingScreen'
import { AnimatedScore }      from '../components/AnimatedScore'
import { Chip }               from '../components/Chip'
import { ResumeUploader }     from '../components/ResumeUploader'

const SYSTEM = "You are an expert recruiter and ATS specialist. Return only valid JSON."

function buildPrompt(resume, jd) {
  return `Compare this resume against the job description. Return ONLY valid JSON:
{
  "matchScore": 74, "atsScore": 68,
  "companyName": "company if mentioned", "jobTitle": "role title",
  "verdict": "STRONG MATCH / MODERATE MATCH / WEAK MATCH",
  "verdictReason": "one sentence",
  "matchedSkills": ["s1","s2","s3"],
  "missingSkills": ["s1","s2","s3"],
  "matchedExperience": ["exp1","exp2"],
  "experienceGaps": ["gap1","gap2"],
  "keywordsToAdd": ["k1","k2","k3","k4"],
  "tailoringTips": ["t1","t2","t3","t4","t5"],
  "summaryRewrite": "tailored 3-sentence summary rewritten for this role",
  "scoreBreakdown": { "skills":80, "experience":70, "education":85, "keywords":60, "culture":75 }
}
RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jd}`
}

export function Matcher({ resumeText, setResumeText, onMatch }) {
  const [jd, setJd]           = useState('')
  const [localResume, setLR]  = useState(resumeText || '')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [filename, setFn]     = useState(null)

  const handleParsed = (text) => {
    setLR(text)
    setResumeText(text)
    setResult(null)
  }

  const run = async () => {
    if (!localResume.trim() || !jd.trim()) return
    setLoading(true); setResult(null)
    try {
      const raw = await callAI([{ role:'user', content: buildPrompt(localResume, jd) }], SYSTEM)
      setResult(parseJSON(raw))
      onMatch()
    } catch { alert('Matching failed — please try again.') }
    setLoading(false)
  }

  if (loading) return <Section num="03"><LoadingScreen text="MATCHING" /></Section>

  const verdictCol = result
    ? result.matchScore >= 75 ? 'var(--teal)' : result.matchScore >= 55 ? 'var(--lime)' : 'var(--red)'
    : 'var(--lime)'

  return (
    <Section num="03">
      <div className="page-wrap">
        <div className="anim-up" style={{ marginBottom:'clamp(18px,2.5vw,30px)' }}>
          <div style={{ fontFamily:"'Bebas Neue'", fontSize:'clamp(32px,4.5vw,52px)', letterSpacing:'.02em', marginBottom:6 }}>JOB MATCHER</div>
          <p style={{ fontSize:'clamp(11px,1.1vw,13px)', color:'var(--dim)', lineHeight:1.7, maxWidth:560 }}>
            Upload your resume and paste a job description to get a fit score, gap analysis, and tailored suggestions.
          </p>
        </div>

        {!result ? (
          <div className="anim-up d1" style={{ display:'flex', flexDirection:'column', gap:1 }}>
            <div className="rf-grid-2">
              {/* Resume upload */}
              <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                <div className="cell" style={{ padding:'10px 14px' }}>
                  <div style={{ fontSize:9, letterSpacing:'.12em', color:'var(--dim)', marginBottom:8 }}>YOUR RESUME</div>
                </div>
                <ResumeUploader onParsed={handleParsed} value={localResume} label="YOUR RESUME — PDF OR DOCX" accentColor="var(--lime30)" />
              </div>

              {/* JD textarea */}
              <div className="cell" style={{ borderLeft:'none', display:'flex', flexDirection:'column' }}>
                <div style={{ fontSize:9, letterSpacing:'.12em', color:'var(--dim)', marginBottom:10 }}>JOB DESCRIPTION</div>
                <textarea
                  value={jd}
                  onChange={e => setJd(e.target.value)}
                  placeholder="Paste the full job description here — requirements, responsibilities, qualifications…"
                  style={{ flex:1, minHeight:'clamp(200px,28vh,380px)', fontSize:11, lineHeight:1.7, borderLeft:'3px solid rgba(94,240,200,.22)' }}
                />
              </div>
            </div>

            <button className="btn-lime" onClick={run} disabled={!localResume.trim() || !jd.trim()}
              style={{ width:'100%', justifyContent:'center', padding:'14px', fontSize:12, letterSpacing:'.12em' }}>
              MATCH RESUME TO JOB →
            </button>
          </div>
        ) : (
          <MatchResult result={result} verdictCol={verdictCol} onReset={() => setResult(null)} />
        )}
      </div>
    </Section>
  )
}

function MatchResult({ result, verdictCol, onReset }) {
  return (
    <div className="anim-up">
      {/* Verdict banner */}
      <div style={{ padding:'clamp(14px,2vw,22px) clamp(16px,2vw,26px)', background:'var(--bg1)', border:'1px solid var(--line)', borderLeft:`4px solid ${verdictCol}`, marginBottom:1, display:'flex', alignItems:'center', gap:'clamp(12px,2vw,22px)', flexWrap:'wrap' }}>
        <div>
          <div style={{ fontFamily:"'Bebas Neue'", fontSize:'clamp(36px,5vw,58px)', color:verdictCol, lineHeight:1 }}>{result.matchScore}%</div>
          <div style={{ fontSize:9, color:'var(--dim)', letterSpacing:'.1em' }}>MATCH SCORE</div>
        </div>
        <div style={{ width:1, height:44, background:'var(--line)', flexShrink:0 }} />
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontFamily:"'Bebas Neue'", fontSize:'clamp(16px,2vw,22px)', color:verdictCol, marginBottom:4 }}>{result.verdict}</div>
          <div style={{ fontSize:'clamp(11px,1vw,13px)', color:'var(--dim)', lineHeight:1.6 }}>{result.verdictReason}</div>
        </div>
        {(result.jobTitle || result.companyName) && (
          <div style={{ textAlign:'right', marginLeft:'auto' }}>
            {result.jobTitle    && <div style={{ fontSize:12 }}>{result.jobTitle}</div>}
            {result.companyName && <div style={{ fontSize:11, color:'var(--dim)' }}>{result.companyName}</div>}
          </div>
        )}
      </div>

      {/* Score breakdown */}
      <div className="rf-grid-5" style={{ marginBottom:1 }}>
        {Object.entries(result.scoreBreakdown || {}).map(([k, v], i) => (
          <div key={k} className="cell" style={{ textAlign:'center', padding:'clamp(12px,1.8vw,20px)', animation:`countUp var(--dur-slow) ${i*60}ms var(--ease-spring) both` }}>
            <AnimatedScore value={v} label={k} color={v>=75?'var(--teal)':v>=55?'var(--lime)':'var(--red)'} size="clamp(28px,3.5vw,40px)" />
          </div>
        ))}
      </div>

      <div className="rf-grid-2" style={{ marginBottom:2 }}>
        <div className="anim-left" style={{ display:'flex', flexDirection:'column', gap:1, animationDelay:'60ms' }}>
          <div className="cell">
            <div style={{ fontSize:9, letterSpacing:'.12em', color:'var(--teal)', marginBottom:12 }}>◆ MATCHED SKILLS</div>
            <div style={{ marginBottom:14 }}>{result.matchedSkills?.map((s,i) => <Chip key={s} text={s} color="var(--teal)" delay={`${i*35}ms`} />)}</div>
            <div style={{ fontSize:9, letterSpacing:'.12em', color:'var(--red)', marginBottom:10 }}>✕ MISSING SKILLS</div>
            {result.missingSkills?.map((s,i) => <Chip key={s} text={s} color="var(--red)" delay={`${i*35}ms`} />)}
          </div>
          <div className="cell">
            <div style={{ fontSize:9, letterSpacing:'.12em', color:'var(--teal)', marginBottom:12 }}>◆ MATCHED EXPERIENCE</div>
            {result.matchedExperience?.map((e,i) => (
              <div key={i} style={{ fontSize:'clamp(11px,1vw,13px)', lineHeight:1.6, marginBottom:8, borderLeft:'2px solid var(--teal)', paddingLeft:10, animation:`fadeUp var(--dur-base) ${i*55}ms var(--ease-spring) both` }}>{e}</div>
            ))}
            {result.experienceGaps?.length > 0 && (
              <>
                <div style={{ fontSize:9, letterSpacing:'.12em', color:'var(--amber)', margin:'14px 0 10px' }}>△ EXPERIENCE GAPS</div>
                {result.experienceGaps.map((e,i) => (
                  <div key={i} style={{ fontSize:'clamp(11px,1vw,13px)', lineHeight:1.6, marginBottom:8, borderLeft:'2px solid var(--amber)', paddingLeft:10, color:'var(--dim)' }}>{e}</div>
                ))}
              </>
            )}
          </div>
        </div>
        <div className="anim-right" style={{ display:'flex', flexDirection:'column', gap:1, animationDelay:'60ms' }}>
          <div className="cell" style={{ background:'var(--lime8)', borderColor:'var(--lime30)' }}>
            <div style={{ fontSize:9, letterSpacing:'.12em', color:'var(--lime)', marginBottom:12 }}>◆ TAILORING TIPS — DO THESE BEFORE APPLYING</div>
            {result.tailoringTips?.map((t,i) => (
              <div key={i} style={{ display:'flex', gap:10, fontSize:'clamp(11px,1vw,13px)', lineHeight:1.6, marginBottom:10, animation:`fadeUp var(--dur-base) ${i*55}ms var(--ease-spring) both` }}>
                <span style={{ fontFamily:"'Bebas Neue'", fontSize:13, color:'var(--lime)', flexShrink:0 }}>{String(i+1).padStart(2,'0')}</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div className="cell">
            <div style={{ fontSize:9, letterSpacing:'.12em', color:'var(--dim)', marginBottom:8 }}>KEYWORDS TO ADD</div>
            {result.keywordsToAdd?.map((k,i) => <Chip key={k} text={k} color="var(--amber)" delay={`${i*35}ms`} />)}
          </div>
          {result.summaryRewrite && (
            <div className="cell" style={{ borderTop:'2px solid var(--lime30)' }}>
              <div style={{ fontSize:9, letterSpacing:'.12em', color:'var(--lime)', marginBottom:12 }}>◆ AI-TAILORED SUMMARY FOR THIS ROLE</div>
              <p style={{ fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:'clamp(14px,1.4vw,18px)', lineHeight:1.8 }}>
                {result.summaryRewrite}
              </p>
            </div>
          )}
        </div>
      </div>

      <button className="btn-ghost" onClick={onReset} style={{ width:'100%', justifyContent:'center', padding:'11px' }}>
        ↺ MATCH ANOTHER JOB
      </button>
    </div>
  )
}