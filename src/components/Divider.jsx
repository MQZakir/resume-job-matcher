export function Divider({ label }) {
  return (
    <div className="divider">
      <span className="divider-label">{label}</span>
      <div className="divider-line" />
    </div>
  )
}
