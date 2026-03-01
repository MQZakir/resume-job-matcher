export function Section({ children, num }) {
  return (
    <div className="section-wrap">
      <span className="bg-num" style={{ top: -20, right: 32 }}>{num}</span>
      <div className="section-inner">{children}</div>
    </div>
  )
}
