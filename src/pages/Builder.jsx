import { useState } from 'react'
import { callAI, parseJSON } from '../utils/api'
import { Section }       from '../components/Section'
import { Divider }       from '../components/Divider'
import { LoadingScreen } from '../components/LoadingScreen'
import { AnimatedScore } from '../components/AnimatedScore'
import { Chip }          from '../components/Chip'

const TEMPLATES = [
  { id: 'modern',        label: 'Modern ATS',        sub: 'Clean, keyword-rich, ATS-friendly'    },
  { id: 'executive',     label: 'Executive',          sub: 'Senior leadership, C-suite focused'   },
  { id: 'creative',      label: 'Creative Pro',       sub: 'Designers, marketers, creatives'      },
  { id: 'tech',          label: 'Tech / Engineering', sub: 'Devs, engineers, data scientists'     },
  { id: 'academic',      label: 'Academic',           sub: 'Academia, research, PhD-level'        },
  { id: 'career-change', label: 'Career Changer',     sub: 'Transitioning to a new field'         },
]

const SYSTEM = "You are an elite resume writer. Create compelling, ATS-optimized resumes. Return only valid JSON."

function buildPrompt(template, form) {
  return `Build a complete professional resume using the "${template}" template style.
Name: ${form.name || 'Alex Johnson'} | Email: ${form.email || 'alex@email.com'} | Phone: ${form.phone || '+1 (555) 000-0000'}
Location: ${form.location || 'New York, NY'} | LinkedIn: ${form.linkedin || 'linkedin.com/in/alexjohnson'}
Target Role: ${form.targetRole} | Experience: ${form.yearsExp} years | Industry: ${form.industry} | Tone: ${form.tone}
Experience: ${form.experience || 'Not provided — generate realistic placeholder'}
Skills: ${form.skills || 'Not provided — generate based on role'}
Education: ${form.education || 'Not provided — generate realistic placeholder'}
Achievements: ${form.achievements || 'Not provided — generate realistic placeholders with metrics'}
Summary notes: ${form.summary || 'Not provided — write a compelling summary'}
Return ONLY valid JSON:
{
  "templateUsed": "${template}",
  "sections": {
    "header": "name + contact info",
    "summary": "professional summary paragraph",
    "experience": "full experience with bullet points",
    "skills": "skills section",
    "education": "education section",
    "achievements": "achievements / projects section"
  },
  "atsScore": 88,
  "keyStrengths": ["s1","s2","s3"],
  "topKeywords": ["k1","k2","k3","k4","k5"],
  "tips": ["tip1","tip2","tip3"]
}`
}

const INITIAL_FORM = {
  name: '', email: '', phone: '', location: '', linkedin: '',
  targetRole: '', yearsExp: '3-5', industry: 'Technology',
  summary: '', skills: '', experience: '', education: '',
  achievements: '', tone: 'professional',
}

export function Builder() {
  const [step, setStep]         = useState('form')
  const [template, setTemplate] = useState('modern')
  const [form, setForm]         = useState(INITIAL_FORM)
  const [resume, setResume]     = useState(null)
  const [copied, setCopied]     = useState(false)

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const build = async () => {
    setStep('loading')
    try {
      const raw = await callAI([{ role: 'user', content: buildPrompt(template, form) }], SYSTEM)
      setResume(parseJSON(raw))
      setStep('result')
    } catch { alert('Build failed — please try again.'); setStep('form') }
  }

  const copy = () => {
    const text = Object.values(resume?.sections || {}).join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 'loading') return <Section num="05"><LoadingScreen text="BUILDING" /></Section>

  /* ── Result ──────────────────────────────────────────────────────────── */
  if (step === 'result' && resume) return (
    <Section num="05">
      <div className="page-wrap">
        <div className="anim-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 'clamp(16px,2vw,26px)', borderBottom: '1px solid var(--line)', paddingBottom: 'clamp(14px,2vw,22px)' }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(28px,4vw,44px)', letterSpacing: '.02em', marginBottom: 4 }}>RESUME BUILT</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, color: 'var(--dim)', letterSpacing: '.1em' }}>TEMPLATE: {resume.templateUsed?.toUpperCase()}</span>
              <span style={{ fontSize: 9, color: 'var(--lime)', letterSpacing: '.1em' }}>ATS SCORE: {resume.atsScore}/100</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 1 }}>
            <button className="btn-lime" onClick={copy}>{copied ? 'COPIED ✓' : 'COPY FULL RESUME'}</button>
            <button className="btn-ghost" onClick={() => setStep('form')}>↺ REBUILD</button>
          </div>
        </div>

        {/* Sidebar layout: resume | analysis */}
        <div className="rf-grid-sidebar">
          <div className="anim-left" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Object.entries(resume.sections || {}).map(([key, content], i) => (
              <div key={key} className="cell"
                style={{ borderLeft: key === 'header' ? '3px solid var(--lime)' : '1px solid var(--line)', animation: `fadeUp var(--dur-base) ${i * 55}ms var(--ease-spring) both` }}>
                <div style={{ fontSize: 9, letterSpacing: '.14em', color: key === 'header' ? 'var(--lime)' : 'var(--dim)', textTransform: 'uppercase', marginBottom: 12 }}>
                  {key === 'header' ? '◆ ' : ''}{key}
                </div>
                <p style={{ fontFamily: "'Instrument Serif',serif", fontSize: 'clamp(13px,1.3vw,16px)', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
                  {content}
                </p>
              </div>
            ))}
          </div>

          <div className="anim-right" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div className="cell" style={{ background: 'var(--lime8)', borderColor: 'var(--lime30)' }}>
              <AnimatedScore value={resume.atsScore} label="ATS SCORE" color="var(--lime)" size="clamp(36px,5vw,56px)" />
              <div className="bar-wrap" style={{ margin: '16px 0' }}>
                <div className="bar-fill" style={{ width: `${resume.atsScore}%`, background: 'var(--lime)' }} />
              </div>
              <div style={{ fontSize: 9, letterSpacing: '.1em', color: 'var(--dim)', marginBottom: 10 }}>KEY STRENGTHS</div>
              {resume.keyStrengths?.map((s, i) => (
                <div key={i} style={{ fontSize: 'clamp(10px,1vw,12px)', lineHeight: 1.6, marginBottom: 7, borderLeft: '2px solid var(--lime30)', paddingLeft: 10, animation: `fadeUp var(--dur-base) ${i * 55}ms var(--ease-spring) both` }}>
                  {s}
                </div>
              ))}
            </div>

            <div className="cell">
              <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--dim)', marginBottom: 10 }}>TOP KEYWORDS INCLUDED</div>
              {resume.topKeywords?.map((k, i) => <Chip key={k} text={k} color="var(--teal)" delay={`${i * 35}ms`} />)}
            </div>

            <div className="cell">
              <div style={{ fontSize: 9, letterSpacing: '.12em', color: 'var(--amber)', marginBottom: 12 }}>△ MAKE IT EVEN BETTER</div>
              {resume.tips?.map((t, i) => (
                <div key={i} style={{ fontSize: 'clamp(10px,1vw,12px)', lineHeight: 1.65, marginBottom: 9, display: 'flex', gap: 8, animation: `fadeUp var(--dur-base) ${i * 55}ms var(--ease-spring) both` }}>
                  <span style={{ color: 'var(--amber)', flexShrink: 0, fontSize: 9, paddingTop: 2 }}>◆</span>
                  <span style={{ color: 'var(--dim)' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  )

  /* ── Form ──────────────────────────────────────────────────────────────── */
  return (
    <Section num="05">
      <div className="page-wrap">
        <div className="anim-up" style={{ marginBottom: 'clamp(18px,2.5vw,30px)' }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(32px,4.5vw,52px)', letterSpacing: '.02em', marginBottom: 6 }}>RESUME BUILDER</div>
          <p style={{ fontSize: 'clamp(11px,1.1vw,13px)', color: 'var(--dim)', lineHeight: 1.7, maxWidth: 560 }}>
            Fill in what you can — AI fills the gaps and builds you a complete job-ready resume.
          </p>
        </div>

        {/* Template picker */}
        <div className="anim-up d1">
          <Divider label="Choose template" />
          <div className="rf-grid-3" style={{ marginBottom: 1 }}>
            {TEMPLATES.map(t => (
              <div key={t.id} onClick={() => setTemplate(t.id)} style={{
                padding: 'clamp(12px,1.5vw,18px)', cursor: 'pointer',
                background: template === t.id ? 'var(--lime8)' : 'var(--bg1)',
                border: `1px solid ${template === t.id ? 'var(--lime30)' : 'var(--line)'}`,
                borderLeft: `3px solid ${template === t.id ? 'var(--lime)' : 'transparent'}`,
                transition: 'all var(--dur-fast) var(--ease-out)',
              }}>
                <div style={{ fontSize: 'clamp(10px,1.1vw,12px)', color: template === t.id ? 'var(--lime)' : 'var(--text)', letterSpacing: '.06em', marginBottom: 3 }}>
                  {template === t.id ? '◆ ' : ''}{t.label}
                </div>
                <div style={{ fontSize: 'clamp(9px,1vw,11px)', color: 'var(--dim)' }}>{t.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Personal info */}
        <div className="anim-up d2">
          <Divider label="Your info" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div className="rf-grid-3-col">
              {[['name','Full Name','Alex Johnson'],['email','Email','alex@email.com'],['phone','Phone','+1 (555) 000-0000']].map(([k,l,ph]) => (
                <div key={k} className="cell" style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 9, letterSpacing: '.1em', color: 'var(--dim)', marginBottom: 7 }}>{l}</div>
                  <input value={form[k]} onChange={e => f(k, e.target.value)} placeholder={ph}
                    style={{ border: 'none', padding: 0, background: 'transparent', fontSize: 12 }} />
                </div>
              ))}
            </div>
            <div className="rf-grid-3-col">
              {[['location','Location','New York, NY'],['linkedin','LinkedIn','linkedin.com/in/you'],['targetRole','Target Role ◆','e.g. Senior Product Manager']].map(([k,l,ph]) => (
                <div key={k} className="cell" style={{ padding: '12px 16px', borderTop: 'none', borderLeft: k === 'targetRole' ? '3px solid var(--lime30)' : undefined }}>
                  <div style={{ fontSize: 9, letterSpacing: '.1em', color: k === 'targetRole' ? 'var(--lime)' : 'var(--dim)', marginBottom: 7 }}>{l}</div>
                  <input value={form[k]} onChange={e => f(k, e.target.value)} placeholder={ph}
                    style={{ border: 'none', padding: 0, background: 'transparent', fontSize: 12 }} />
                </div>
              ))}
            </div>
            <div className="rf-grid-3-col">
              {[
                { k: 'yearsExp', l: 'YEARS EXP.', el: (
                  <select value={form.yearsExp} onChange={e => f('yearsExp', e.target.value)} style={{ border:'none',padding:0,background:'transparent',fontSize:12,color:'var(--text)',width:'100%' }}>
                    {['0-1','1-3','3-5','5-8','8-12','12+'].map(y=><option key={y}>{y} years</option>)}
                  </select>
                )},
                { k: 'industry', l: 'INDUSTRY', el: (
                  <select value={form.industry} onChange={e => f('industry', e.target.value)} style={{ border:'none',padding:0,background:'transparent',fontSize:12,color:'var(--text)',width:'100%' }}>
                    {['Technology','Finance','Healthcare','Marketing','Design','Education','Engineering','Law','Sales','Consulting','Other'].map(i=><option key={i}>{i}</option>)}
                  </select>
                )},
                { k: 'tone', l: 'TONE', el: (
                  <select value={form.tone} onChange={e => f('tone', e.target.value)} style={{ border:'none',padding:0,background:'transparent',fontSize:12,color:'var(--text)',width:'100%' }}>
                    {['professional','confident','executive','creative','data-driven','startup'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                )},
              ].map(({ k, l, el }) => (
                <div key={k} className="cell" style={{ padding: '12px 16px', borderTop: 'none' }}>
                  <div style={{ fontSize: 9, letterSpacing: '.1em', color: 'var(--dim)', marginBottom: 7 }}>{l}</div>
                  {el}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content fields */}
        <div className="anim-up d3">
          <Divider label="Your content — AI fills what you skip" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div className="rf-grid-fields">
              {[
                ['experience',   'Work Experience',   'List your roles and responsibilities…'],
                ['skills',       'Skills',            'Technical skills, tools, languages, certs…'],
                ['education',    'Education',         'Degrees, universities, graduation years…'],
                ['achievements', 'Achievements',      'Awards, metrics, projects, side work…'],
              ].map(([k, l, ph]) => (
                <div key={k} className="cell">
                  <div style={{ fontSize: 9, letterSpacing: '.1em', color: 'var(--dim)', marginBottom: 8 }}>{l}</div>
                  <textarea value={form[k]} onChange={e => f(k, e.target.value)} placeholder={ph}
                    style={{ minHeight: 'clamp(80px,10vh,120px)', fontSize: 11, lineHeight: 1.65, border: 'none', background: 'transparent', padding: 0 }} />
                </div>
              ))}
            </div>
            <div className="cell">
              <div style={{ fontSize: 9, letterSpacing: '.1em', color: 'var(--dim)', marginBottom: 8 }}>SUMMARY NOTES (OPTIONAL)</div>
              <textarea value={form.summary} onChange={e => f('summary', e.target.value)}
                placeholder="Notes about what to highlight — AI crafts the full summary…"
                style={{ minHeight: 60, fontSize: 11, lineHeight: 1.65, border: 'none', background: 'transparent', padding: 0 }} />
            </div>
          </div>
        </div>

        <button className="btn-lime anim-up d4" onClick={build} disabled={!form.targetRole.trim()}
          style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: 12, letterSpacing: '.12em', marginTop: 1 }}>
          BUILD RESUME WITH AI →
        </button>
      </div>
    </Section>
  )
}