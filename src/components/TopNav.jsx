import { memo, useState } from 'react'
import { useScramble }  from '../hooks/useScramble'
import { useCountUp }   from '../hooks/useCountUp'
import { ReziqLogo }    from './ReziqLogo'

const NAV_ITEMS = [
  { id: 'home',     label: 'OVERVIEW'   },
  { id: 'analyzer', label: 'ANALYZER'   },
  { id: 'matcher',  label: 'JOB MATCH'  },
  { id: 'fixer',    label: 'FIXER'      },
  { id: 'builder',  label: 'BUILDER'    },
]

const NavBtn = memo(({ id, label, active, onClick }) => {
  const [hovered, setHovered] = useState(false)
  const display = useScramble(label, hovered)

  return (
    <button
      className={`nav-btn ${active ? 'active' : 'dim'}`}
      onClick={() => onClick(id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {display}
      {active && <span className="nav-active-line" />}
    </button>
  )
})
NavBtn.displayName = 'NavBtn'

function StatCell({ label, value }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0, 700)
  return (
    <div className="nav-stat">
      <span className="nav-stat-val">
        {typeof value === 'number' ? animated : value}
      </span>
      <span className="nav-stat-label">{label}</span>
    </div>
  )
}

export function TopNav({ active, setActive, stats }) {
  return (
    <nav className="top-nav">
      {/* Logo */}
      <div className="nav-logo">
        <ReziqLogo size={30} />
      </div>

      {/* Nav items — horizontally scrollable on small screens */}
      <div className="nav-items">
        {NAV_ITEMS.map(n => (
          <NavBtn
            key={n.id}
            id={n.id}
            label={n.label}
            active={active === n.id}
            onClick={setActive}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="nav-stats">
        <StatCell label="ATS"   value={stats.atsScore ?? '—'} />
        <StatCell label="JOBS"  value={stats.jobs} />
        <StatCell label="FIXES" value={stats.fixes} />
      </div>
    </nav>
  )
}