export function Chip({ text, color = 'var(--lime)', delay = '0ms' }) {
  return (
    <span
      className="chip"
      style={{ color, borderColor: `${color}35`, animationDelay: delay }}
    >
      {text}
    </span>
  )
}
