import { useInView } from '../hooks/useInView'
import { useCountUp } from '../hooks/useCountUp'

export function AnimatedScore({ value, label, color = 'var(--lime)', size = '44px' }) {
  const [ref, inView] = useInView()
  const animated = useCountUp(value, 900, inView)

  // Accept both number (legacy) and CSS string ('clamp(...)' / '44px')
  const fontSize = typeof size === 'number' ? `${size}px` : size

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize,
          color,
          lineHeight: 1,
          letterSpacing: '.01em',
          animation: inView ? 'countUp 0.5s var(--ease-spring) both' : 'none',
        }}
      >
        {animated}
      </div>
      <div style={{ fontSize: 8, color: 'var(--dim)', letterSpacing: '.12em', marginTop: 4, textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  )
}