export function LoadingScreen({ text = 'PROCESSING' }) {
  return (
    <div className="loading-screen">
      <div className="loading-title">{text}</div>
      <div className="dot-loader">
        <span /><span /><span />
      </div>
      <div className="loading-sub">AI IS WORKING</div>
    </div>
  )
}
