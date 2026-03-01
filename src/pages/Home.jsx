import { Section } from '../components/Section'
import { Divider } from '../components/Divider'

const WORKFLOW = [
  ['01', 'PASTE RESUME',    'Drop your current resume text into the analyzer'],
  ['02', 'RUN ANALYSIS',    'Get your ATS score and a full section breakdown'],
  ['03', 'MATCH A JOB',     'Paste any job description to get a fit score'],
  ['04', 'FIX WEAKNESSES',  'AI rewrites any section to be stronger'],
  ['05', 'BUILD FROM ZERO', 'Generate a complete resume from a template'],
]

const TOOLS = [
  { icon: '◎', label: 'Analyzer',    sub: 'ATS audit & content breakdown', tab: 'analyzer', col: 'var(--lime)'  },
  { icon: '⊗', label: 'Job Matcher', sub: 'Match resume to any job post',   tab: 'matcher',  col: 'var(--teal)' },
  { icon: '⊕', label: 'Fixer',       sub: 'AI rewrites weak sections',      tab: 'fixer',    col: 'var(--amber)'},
  { icon: '◈', label: 'Builder',     sub: 'Generate from scratch with AI',  tab: 'builder',  col: 'var(--blue)' },
]

export function Home({ onNavigate, resumeText, stats }) {
  return (
    <Section num="01">
      <div className="page-wrap">

        {/* Hero */}
        <div className="anim-up" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 'clamp(20px,3vw,36px)', marginBottom: 'clamp(20px,3vw,36px)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(10px,2vw,20px)', marginBottom: 10 }}>
            <h1 className="hero-title">
              RESUME<br />
              <span style={{ color: 'var(--lime)' }}>FORGE</span>
            </h1>
            <div style={{ paddingBottom: 10 }}>
              <div style={{ fontSize: 9, letterSpacing: '.14em', color: 'var(--dim)', textTransform: 'uppercase', marginBottom: 4 }}>AI JOB TOOLKIT</div>
              <div style={{ fontSize: 9, letterSpacing: '.1em',  color: 'var(--dim2)', textTransform: 'uppercase' }}>v1.0 · ACTIVE</div>
            </div>
          </div>
          <p style={{ fontSize: 'clamp(11px,1.1vw,13px)', color: 'var(--dim)', maxWidth: 520, lineHeight: 1.8 }}>
            Analyze, match, fix, and build resumes with AI. Stop guessing — know exactly where you stand and what to change.
          </p>
        </div>

        {/* Status strip */}
        <div className="anim-up d1 rf-grid-4" style={{ marginBottom: 'clamp(20px,3vw,36px)' }}>
          {[
            { label: 'Resume Status',  val: resumeText ? 'LOADED' : 'NONE',                col: resumeText ? 'var(--teal)' : 'var(--red)'  },
            { label: 'ATS Score',      val: stats.atsScore ? `${stats.atsScore}/100` : '—', col: 'var(--lime)'  },
            { label: 'Jobs Matched',   val: stats.jobs,                                     col: 'var(--blue)'  },
            { label: 'Sections Fixed', val: stats.fixes,                                    col: 'var(--amber)' },
          ].map(s => (
            <div key={s.label} className="cell" style={{ textAlign: 'center', padding: 'clamp(14px,2vw,22px)' }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(24px,3.5vw,40px)', color: s.col, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 9, color: 'var(--dim)', letterSpacing: '.1em', marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tool cards */}
        <div className="anim-up d2" style={{ marginBottom: 'clamp(20px,3vw,36px)' }}>
          <Divider label="Tools" />
          <div className="rf-grid-4">
            {TOOLS.map(t => (
              <div key={t.tab} className="cell cell-hover hover-card" onClick={() => onNavigate(t.tab)}
                style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', padding: 'clamp(16px,2vw,28px)' }}>
                <div className="hover-line" style={{ background: t.col }} />
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(24px,3vw,36px)', color: t.col, marginBottom: 10 }}>{t.icon}</div>
                <div style={{ fontSize: 'clamp(11px,1.1vw,13px)', letterSpacing: '.04em', marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 'clamp(10px,1vw,12px)', color: 'var(--dim)' }}>{t.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow */}
        <div className="anim-up d3">
          <Divider label="How it works" />
          <div className="rf-grid-5">
            {WORKFLOW.map(([n, h, s], i) => (
              <div key={n} className="cell"
                style={{ padding: 'clamp(14px,1.8vw,22px)', animation: `fadeUp var(--dur-base) ${i * 60}ms var(--ease-spring) both` }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(24px,3vw,36px)', color: 'var(--dim2)', marginBottom: 10 }}>{n}</div>
                <div style={{ fontSize: 9, letterSpacing: '.08em', color: 'var(--lime)', marginBottom: 6, textTransform: 'uppercase' }}>{h}</div>
                <div style={{ fontSize: 'clamp(10px,1vw,12px)', color: 'var(--dim)', lineHeight: 1.65 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Section>
  )
}