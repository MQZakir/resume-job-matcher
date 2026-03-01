import { useInView } from '../hooks/useInView'

export function ScoreBar({ label, value, color = 'var(--lime)', delay = '0s' }) {
  const [ref, inView] = useInView()

  return (
    <div ref={ref} style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontSize: 11, fontFamily: "'Bebas Neue'", color }}>
          {value}%
        </span>
      </div>
      <div className="bar-wrap">
        <div
          className="bar-fill"
          style={{
            width: inView ? `${value}%` : '0%',
            background: color,
            transitionDelay: delay,
          }}
        />
      </div>
    </div>
  )
}
