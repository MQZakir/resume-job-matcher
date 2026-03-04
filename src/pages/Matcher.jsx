import { useState, useCallback } from 'react'
import { callAI, parseJSON, searchJobs } from '../utils/api'
import { Section }        from '../components/Section'
import { LoadingScreen }  from '../components/LoadingScreen'
import { AnimatedScore }  from '../components/AnimatedScore'
import { Chip }           from '../components/Chip'
import { Divider }        from '../components/Divider'
import { ResumeUploader } from '../components/ResumeUploader'

// ─── PROMPTS ──────────────────────────────────────────────────────────────────

const MATCH_SYSTEM = "You are an expert recruiter and ATS specialist. Return only valid JSON."

function buildMatchPrompt(resume, jd) {
  return `Compare this resume to the job description. Return ONLY valid JSON:
{
  "matchScore": 74, "atsScore": 68,
  "companyName": "company if mentioned", "jobTitle": "role title",
  "verdict": "STRONG MATCH",
  "verdictReason": "one clear sentence explaining the verdict",
  "matchedSkills": ["s1","s2","s3"],
  "missingSkills": ["s1","s2"],
  "matchedExperience": ["exp1","exp2"],
  "experienceGaps": ["gap1"],
  "keywordsToAdd": ["k1","k2","k3"],
  "tailoringTips": ["t1","t2","t3","t4"],
  "summaryRewrite": "A powerful 3-sentence summary rewritten specifically for this role.",
  "scoreBreakdown": { "skills":80, "experience":70, "education":85, "keywords":60, "culture":75 }
}
RESUME:
${resume}

JOB DESCRIPTION:
${jd}`
}

const EXTRACT_SYSTEM = "You are a resume parser. Extract job search metadata. Return only valid JSON."

function buildExtractPrompt(resume) {
  return `Read this resume and extract the best search terms to find matching jobs. Return ONLY valid JSON:
{
  "primaryTitle": "the single most accurate current/target job title (e.g. 'Senior Product Manager')",
  "alternativeTitles": ["alt role 1", "alt role 2"],
  "topSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "seniority": "Junior / Mid-level / Senior / Lead / Principal / Director",
  "preferredLocation": "city or 'Remote' — infer from resume or leave 'Remote' if unclear",
  "industry": "primary industry (e.g. 'FinTech', 'Healthcare', 'SaaS')",
  "searchQueries": [
    "primary search query (title + top skill)",
    "broader search query",
    "niche/specific search query"
  ]
}
RESUME:
${resume}`
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function Matcher({ resumeText, setResumeText, onMatch }) {
  const [mode, setMode]         = useState('match')      // 'match' | 'discover'
  const [localResume, setLR]    = useState(resumeText || '')
  const [jd, setJd]             = useState('')
  const [matchResult, setMR]    = useState(null)
  const [jobs, setJobs]         = useState(null)
  const [profile, setProfile]   = useState(null)         // extracted resume profile
  const [loading, setLoading]   = useState(false)
  const [loadMsg, setLoadMsg]   = useState('MATCHING')
  const [jobPage, setJobPage]   = useState(1)
  const [searching, setSearching] = useState(false)

  const handleParsed = useCallback((text) => {
    setLR(text)
    setResumeText(text)
    setMR(null)
    setJobs(null)
    setProfile(null)
  }, [setResumeText])

  // ── MODE: MATCH TO JOB ──────────────────────────────────────────────────────
  const runMatch = async () => {
    if (!localResume.trim() || !jd.trim()) return
    setLoading(true); setLoadMsg('MATCHING'); setMR(null)
    try {
      const raw = await callAI([{ role: 'user', content: buildMatchPrompt(localResume, jd) }], MATCH_SYSTEM)
      setMR(parseJSON(raw))
      onMatch()
    } catch { alert('Matching failed — please try again.') }
    setLoading(false)
  }

  // ── MODE: DISCOVER JOBS ─────────────────────────────────────────────────────
  const runDiscover = async (page = 1) => {
    if (!localResume.trim()) return
    setLoading(page === 1)
    setSearching(page > 1)
    setLoadMsg('SEARCHING JOBS')

    try {
      // Step 1: Claude extracts role, skills, location from resume
      let prof = profile
      if (!prof || page === 1) {
        const raw = await callAI([{ role: 'user', content: buildExtractPrompt(localResume) }], EXTRACT_SYSTEM, 600)
        prof = parseJSON(raw)
        setProfile(prof)
      }

      // Step 2: Search job boards via JSearch API
      const query    = prof.searchQueries?.[0] || prof.primaryTitle
      const location = prof.preferredLocation || ''
      const results  = await searchJobs(query, location, page)

      setJobs(prev => page === 1 ? results : [...(prev || []), ...results])
      setJobPage(page)
      if (page === 1) onMatch()
    } catch (e) {
      alert(`Job search failed: ${e.message}`)
    }

    setLoading(false)
    setSearching(false)
  }

  if (loading) return <Section num="03"><LoadingScreen text={loadMsg} /></Section>

  return (
    <Section num="03">
      <div className="page-wrap">

        {/* Header */}
        <div className="anim-up" style={{ marginBottom: 'clamp(18px,2.5vw,32px)' }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(32px,4.5vw,56px)', letterSpacing: '.02em', marginBottom: 6 }}>
            JOB MATCHER
          </div>
          <p style={{ fontSize: 'clamp(12px,1.2vw,15px)', color: 'var(--dim)', lineHeight: 1.7, maxWidth: 600 }}>
            Match your resume to a specific job description — or let REZIQ search real job boards and surface roles that fit your profile.
          </p>
        </div>

        {/* Mode switcher */}
        <div className="anim-up d1" style={{ display: 'flex', gap: 1, marginBottom: 1 }}>
          {[
            { id: 'match',    label: 'MATCH TO JOB',   sub: 'Paste a job description',       col: 'var(--lime)'  },
            { id: 'discover', label: 'FIND MATCHING JOBS', sub: 'Search real job boards',    col: 'var(--teal)'  },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                flex: 1,
                padding: 'clamp(14px,2vw,22px)',
                background: mode === m.id ? (m.id === 'match' ? 'var(--lime8)' : 'rgba(94,240,200,.06)') : 'var(--bg1)',
                border: `1px solid ${mode === m.id ? (m.id === 'match' ? 'var(--lime30)' : 'rgba(94,240,200,.25)') : 'var(--line)'}`,
                borderLeft: `3px solid ${mode === m.id ? m.col : 'transparent'}`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--dur-base) var(--ease-out)',
              }}
            >
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(16px,2vw,22px)', color: mode === m.id ? m.col : 'var(--text)', marginBottom: 4 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--dim)', letterSpacing: '.06em' }}>{m.sub}</div>
            </button>
          ))}
        </div>

        {/* ── MATCH MODE ─────────────────────────────────────────────────────── */}
        {mode === 'match' && (
          matchResult ? (
            <MatchResult result={matchResult} onReset={() => setMR(null)} />
          ) : (
            <div className="anim-up d2" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div className="rf-grid-2">
                <div className="cell">
                  <ResumeUploader
                    onParsed={handleParsed}
                    value={localResume}
                    label="YOUR RESUME — PDF OR DOCX"
                    accentColor="var(--lime30)"
                  />
                </div>
                <div className="cell" style={{ borderLeft: 'none', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 11, letterSpacing: '.12em', color: 'var(--dim)', marginBottom: 12, textTransform: 'uppercase' }}>
                    Job Description — paste full text
                  </div>
                  <textarea
                    value={jd}
                    onChange={e => setJd(e.target.value)}
                    placeholder="Paste the entire job posting — requirements, responsibilities, qualifications, company info…"
                    style={{
                      flex: 1,
                      minHeight: 'clamp(200px,28vh,400px)',
                      fontSize: 13, lineHeight: 1.75,
                      borderLeft: '3px solid rgba(94,240,200,.22)',
                    }}
                  />
                </div>
              </div>
              <button
                className="btn-lime"
                onClick={runMatch}
                disabled={!localResume.trim() || !jd.trim()}
                style={{ width: '100%', justifyContent: 'center', padding: 16, fontSize: 13, letterSpacing: '.12em' }}
              >
                MATCH RESUME TO JOB →
              </button>
            </div>
          )
        )}

        {/* ── DISCOVER MODE ───────────────────────────────────────────────────── */}
        {mode === 'discover' && (
          <div className="anim-up d2" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {!jobs ? (
              <>
                <div className="cell">
                  <ResumeUploader
                    onParsed={handleParsed}
                    value={localResume}
                    label="YOUR RESUME — PDF OR DOCX"
                    accentColor="rgba(94,240,200,.28)"
                  />
                </div>
                <div className="cell" style={{ background: 'rgba(94,240,200,.04)', borderColor: 'rgba(94,240,200,.15)', borderTop: 'none' }}>
                  <div style={{ fontSize: 12, color: 'var(--dim)', lineHeight: 1.7 }}>
                    <span style={{ color: 'var(--teal)', marginRight: 8 }}>◆</span>
                    REZIQ reads your resume, extracts your role + skills, then searches Indeed, LinkedIn, Glassdoor, and ZipRecruiter — returning real job listings with apply links.
                  </div>
                </div>
                <button
                  className="btn-lime"
                  onClick={() => runDiscover(1)}
                  disabled={!localResume.trim()}
                  style={{
                    width: '100%', justifyContent: 'center', padding: 16,
                    fontSize: 13, letterSpacing: '.12em',
                    background: 'var(--teal)', color: '#060606',
                  }}
                >
                  FIND JOBS THAT MATCH MY RESUME →
                </button>
              </>
            ) : (
              <JobResults
                jobs={jobs}
                profile={profile}
                page={jobPage}
                searching={searching}
                onLoadMore={() => runDiscover(jobPage + 1)}
                onReset={() => { setJobs(null); setProfile(null); setJobPage(1) }}
              />
            )}
          </div>
        )}
      </div>
    </Section>
  )
}

// ─── MATCH RESULT VIEW ────────────────────────────────────────────────────────

function MatchResult({ result, onReset }) {
  const verdictCol = result.matchScore >= 75 ? 'var(--teal)' : result.matchScore >= 55 ? 'var(--lime)' : 'var(--red)'

  return (
    <div className="anim-up">
      {/* Verdict banner */}
      <div style={{
        padding: 'clamp(14px,2vw,24px) clamp(16px,2vw,28px)',
        background: 'var(--bg1)',
        border: '1px solid var(--line)',
        borderLeft: `4px solid ${verdictCol}`,
        marginBottom: 1,
        display: 'flex', alignItems: 'center', gap: 'clamp(12px,2vw,24px)', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(40px,5.5vw,64px)', color: verdictCol, lineHeight: 1 }}>
            {result.matchScore}%
          </div>
          <div style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: '.1em' }}>MATCH SCORE</div>
        </div>
        <div style={{ width: 1, height: 48, background: 'var(--line)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(18px,2.2vw,26px)', color: verdictCol, marginBottom: 6 }}>
            {result.verdict}
          </div>
          <div style={{ fontSize: 'clamp(12px,1.1vw,14px)', color: 'var(--dim)', lineHeight: 1.6 }}>
            {result.verdictReason}
          </div>
        </div>
        {(result.jobTitle || result.companyName) && (
          <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
            {result.jobTitle    && <div style={{ fontSize: 13 }}>{result.jobTitle}</div>}
            {result.companyName && <div style={{ fontSize: 12, color: 'var(--dim)' }}>{result.companyName}</div>}
          </div>
        )}
      </div>

      {/* Score breakdown */}
      <div className="rf-grid-5" style={{ marginBottom: 1 }}>
        {Object.entries(result.scoreBreakdown || {}).map(([k, v], i) => (
          <div key={k} className="cell" style={{ textAlign: 'center', padding: 'clamp(14px,2vw,22px)', animation: `countUp var(--dur-slow) ${i * 60}ms var(--ease-spring) both` }}>
            <AnimatedScore value={v} label={k} color={v >= 75 ? 'var(--teal)' : v >= 55 ? 'var(--lime)' : 'var(--red)'} size="clamp(30px,4vw,44px)" />
          </div>
        ))}
      </div>

      <div className="rf-grid-2" style={{ marginBottom: 2 }}>
        <div className="anim-left" style={{ display: 'flex', flexDirection: 'column', gap: 1, animationDelay: '60ms' }}>
          <div className="cell">
            <div style={{ fontSize: 10, letterSpacing: '.12em', color: 'var(--teal)', marginBottom: 14 }}>◆ MATCHED SKILLS</div>
            <div style={{ marginBottom: 16 }}>
              {result.matchedSkills?.map((s, i) => <Chip key={s} text={s} color="var(--teal)" delay={`${i * 35}ms`} />)}
            </div>
            <div style={{ fontSize: 10, letterSpacing: '.12em', color: 'var(--red)', marginBottom: 10 }}>✕ MISSING SKILLS</div>
            {result.missingSkills?.map((s, i) => <Chip key={s} text={s} color="var(--red)" delay={`${i * 35}ms`} />)}
          </div>
          <div className="cell">
            <div style={{ fontSize: 10, letterSpacing: '.12em', color: 'var(--teal)', marginBottom: 14 }}>◆ MATCHED EXPERIENCE</div>
            {result.matchedExperience?.map((e, i) => (
              <div key={i} style={{ fontSize: 'clamp(12px,1.1vw,14px)', lineHeight: 1.7, marginBottom: 10, borderLeft: '2px solid var(--teal)', paddingLeft: 12, animation: `fadeUp var(--dur-base) ${i * 55}ms var(--ease-spring) both` }}>{e}</div>
            ))}
            {result.experienceGaps?.length > 0 && (
              <>
                <div style={{ fontSize: 10, letterSpacing: '.12em', color: 'var(--amber)', margin: '16px 0 12px' }}>△ EXPERIENCE GAPS</div>
                {result.experienceGaps.map((e, i) => (
                  <div key={i} style={{ fontSize: 'clamp(12px,1.1vw,14px)', lineHeight: 1.7, marginBottom: 10, borderLeft: '2px solid var(--amber)', paddingLeft: 12, color: 'var(--dim)' }}>{e}</div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="anim-right" style={{ display: 'flex', flexDirection: 'column', gap: 1, animationDelay: '60ms' }}>
          <div className="cell" style={{ background: 'var(--lime8)', borderColor: 'var(--lime30)' }}>
            <div style={{ fontSize: 10, letterSpacing: '.12em', color: 'var(--lime)', marginBottom: 14 }}>◆ TAILORING TIPS — DO BEFORE APPLYING</div>
            {result.tailoringTips?.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, fontSize: 'clamp(12px,1.1vw,14px)', lineHeight: 1.7, marginBottom: 12, animation: `fadeUp var(--dur-base) ${i * 55}ms var(--ease-spring) both` }}>
                <span style={{ fontFamily: "'Bebas Neue'", fontSize: 15, color: 'var(--lime)', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div className="cell">
            <div style={{ fontSize: 10, letterSpacing: '.12em', color: 'var(--dim)', marginBottom: 10 }}>KEYWORDS TO ADD</div>
            {result.keywordsToAdd?.map((k, i) => <Chip key={k} text={k} color="var(--amber)" delay={`${i * 35}ms`} />)}
          </div>
          {result.summaryRewrite && (
            <div className="cell" style={{ borderTop: '2px solid var(--lime30)' }}>
              <div style={{ fontSize: 10, letterSpacing: '.12em', color: 'var(--lime)', marginBottom: 14 }}>◆ AI-TAILORED SUMMARY FOR THIS ROLE</div>
              <p style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontSize: 'clamp(15px,1.5vw,19px)', lineHeight: 1.85 }}>
                {result.summaryRewrite}
              </p>
            </div>
          )}
        </div>
      </div>

      <button className="btn-ghost" onClick={onReset} style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
        ↺ MATCH ANOTHER JOB
      </button>
    </div>
  )
}

// ─── JOB DISCOVERY RESULTS ────────────────────────────────────────────────────

function JobCard({ job, index }) {
  const timeAgo = (iso) => {
    if (!iso) return ''
    const days = Math.floor((Date.now() - new Date(iso)) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7)  return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    return `${Math.floor(days / 30)}mo ago`
  }

  const isDemo = job.id?.startsWith('demo')

  return (
    <div
      className="cell cell-hover"
      style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        borderLeft: '3px solid var(--line)',
        animation: `fadeUp var(--dur-base) ${index * 55}ms var(--ease-spring) both`,
        transition: 'border-left-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)',
        cursor: 'default',
      }}
      onMouseEnter={e => e.currentTarget.style.borderLeftColor = 'var(--teal)'}
      onMouseLeave={e => e.currentTarget.style.borderLeftColor = 'var(--line)'}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        {/* Logo placeholder */}
        <div style={{
          width: 40, height: 40, background: 'var(--bg2)',
          border: '1px solid var(--line2)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Bebas Neue'", fontSize: 14, color: 'var(--teal)',
          overflow: 'hidden',
        }}>
          {job.logo
            ? <img src={job.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : (job.company?.[0] || '?')}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(16px,2vw,22px)', letterSpacing: '.02em', marginBottom: 4 }}>
            {job.title}
          </div>
          <div style={{ fontSize: 13, color: 'var(--dim)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span>{job.company}</span>
            <span style={{ color: 'var(--line2)' }}>·</span>
            <span>{job.location}</span>
            {job.remote && <><span style={{ color: 'var(--line2)' }}>·</span><span style={{ color: 'var(--teal)', fontSize: 11 }}>REMOTE</span></>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          {job.salary && (
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 16, color: 'var(--lime)' }}>{job.salary}</div>
          )}
          <div style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: '.06em' }}>
            {timeAgo(job.posted)} via {job.source}
          </div>
        </div>
      </div>

      {/* Description preview */}
      {job.description && (
        <div style={{ fontSize: 12, color: 'var(--dim)', lineHeight: 1.7, borderLeft: '2px solid var(--line2)', paddingLeft: 12 }}>
          {job.description.slice(0, 200)}{job.description.length > 200 ? '…' : ''}
        </div>
      )}

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
        <span style={{
          fontSize: 10, letterSpacing: '.08em', padding: '3px 10px',
          border: '1px solid var(--line2)', color: 'var(--dim)',
        }}>
          {job.type}
        </span>
        {isDemo && (
          <span style={{ fontSize: 10, color: 'var(--amber)', letterSpacing: '.08em' }}>
            DEMO — add VITE_JSEARCH_KEY for real listings
          </span>
        )}
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginLeft: 'auto',
            background: 'var(--teal)', color: '#060606',
            fontFamily: "'DM Mono'", fontSize: 11, letterSpacing: '.1em',
            padding: '8px 18px', border: 'none', cursor: 'pointer',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
            transition: 'opacity var(--dur-fast) var(--ease-out)',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          APPLY →
        </a>
      </div>
    </div>
  )
}

function JobResults({ jobs, profile, page, searching, onLoadMore, onReset }) {
  return (
    <div>
      {/* Profile strip */}
      {profile && (
        <div className="cell anim-up" style={{ borderLeft: '3px solid var(--teal)', marginBottom: 1, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(18px,2.2vw,24px)', color: 'var(--teal)' }}>
              {profile.primaryTitle}
            </div>
            <div style={{ fontSize: 11, color: 'var(--dim)' }}>
              {profile.seniority} · {profile.industry} · {profile.preferredLocation}
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {profile.topSkills?.slice(0, 5).map(s => (
              <span key={s} style={{ fontSize: 10, padding: '3px 10px', border: '1px solid rgba(94,240,200,.3)', color: 'var(--teal)', letterSpacing: '.06em' }}>{s}</span>
            ))}
          </div>
          <button onClick={onReset} className="btn-ghost" style={{ fontSize: 11, padding: '8px 16px' }}>↺ SEARCH AGAIN</button>
        </div>
      )}

      {/* Info */}
      <div style={{
        padding: '10px 18px', marginBottom: 1,
        background: 'rgba(94,240,200,.04)', border: '1px solid rgba(94,240,200,.15)',
        fontSize: 11, color: 'var(--teal)', letterSpacing: '.06em',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span>◆ {jobs.length} JOBS FOUND</span>
        <span style={{ color: 'var(--dim)' }}>—</span>
        <span style={{ color: 'var(--dim)' }}>sourced from Indeed, LinkedIn, Glassdoor, ZipRecruiter</span>
      </div>

      {/* Job cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 1 }}>
        {jobs.map((job, i) => <JobCard key={job.id || i} job={job} index={i} />)}
      </div>

      {/* Load more */}
      <button
        className="btn-ghost"
        onClick={onLoadMore}
        disabled={searching}
        style={{ width: '100%', justifyContent: 'center', padding: 14 }}
      >
        {searching ? 'SEARCHING…' : 'LOAD MORE JOBS →'}
      </button>
    </div>
  )
}