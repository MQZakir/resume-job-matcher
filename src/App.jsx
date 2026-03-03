import { useState, useCallback } from 'react'

import { Background } from './components/Background'
import { TopNav }     from './components/TopNav'
import { Home }       from './pages/Home'
import { Analyzer }   from './pages/Analyzer'
import { Matcher }    from './pages/Matcher'
import { Fixer }      from './pages/Fixer'
import { Builder }    from './pages/Builder'

export default function App() {
  const [tab, setTab]           = useState('home')
  const [resumeText, setResume] = useState('')
  const [stats, setStats]       = useState({ atsScore: null, jobs: 0, fixes: 0 })

  const onAnalyze     = useCallback(ats => setStats(s => ({ ...s, atsScore: ats })), [])
  const onMatch       = useCallback(()  => setStats(s => ({ ...s, jobs:  s.jobs  + 1 })), [])
  const onFix         = useCallback(()  => setStats(s => ({ ...s, fixes: s.fixes + 1 })), [])
  const setResumeText = useCallback(text => setResume(text), [])

  const pages = {
    home:     <Home onNavigate={setTab} resumeText={resumeText} stats={stats} />,
    analyzer: <Analyzer resumeText={resumeText} setResumeText={setResumeText} onAnalyze={onAnalyze} />,
    matcher:  <Matcher  resumeText={resumeText} setResumeText={setResumeText} onMatch={onMatch} />,
    fixer:    <Fixer    resumeText={resumeText} setResumeText={setResumeText} onFix={onFix} />,
    builder:  <Builder />,
  }

  return (
    <>
      <Background />

      {/* Floating nav — fixed, sits above everything */}
      <TopNav active={tab} setActive={setTab} stats={stats} />

      {/* Full-height scroll container with top padding to clear floating nav */}
      <div
        key={tab}
        style={{
          height: '100vh',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1,
          paddingTop: 90,   /* nav height (46px) + top offset (14px) + gap (16px) */
        }}
      >
        {pages[tab]}
      </div>
    </>
  )
}