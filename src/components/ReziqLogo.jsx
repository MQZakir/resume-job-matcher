/**
 * REZIQ Logo — AI Document concept
 *
 * A document whose "text lines" are animated neural data streams.
 * The top-right corner is folded back to reveal a glowing circuit node —
 * symbolising the AI intelligence inside the document.
 *
 * Usage:
 *   <ReziqLogo size={32} />           — icon only (navbar)
 *   <ReziqLogo size={48} withText />   — icon + wordmark
 */

import { useId } from 'react'

export function ReziqLogo({ size = 32, withText = false, style = {} }) {
  const uid = useId().replace(/:/g, '')

  // Scale everything from a 40×48 viewBox
  const vw = 40
  const vh = 48

  return (
    <svg
      width={withText ? size * 3.6 : size}
      height={size}
      viewBox={withText ? `0 0 ${vw + size * 2.6} ${vh}` : `0 0 ${vw} ${vh}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', overflow: 'visible', ...style }}
      aria-label="REZIQ"
    >
      <defs>
        {/* Lime glow */}
        <filter id={`glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Soft glow for lines */}
        <filter id={`softglow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Node pulse */}
        <radialGradient id={`nodeGrad-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#c2f135" />
          <stop offset="100%" stopColor="#8ab82a" />
        </radialGradient>

        {/* Corner fold gradient */}
        <linearGradient id={`fold-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#c2f135" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#c2f135" stopOpacity="0.05" />
        </linearGradient>

        {/* Data stream clip — stays inside doc body */}
        <clipPath id={`docClip-${uid}`}>
          <path d="M2,3 L26,3 L26,9 L32,9 L32,46 L2,46 Z" />
        </clipPath>

        {/* Stream animations */}
        <style>{`
          @keyframes reziq-stream-${uid} {
            0%   { stroke-dashoffset: 60; opacity: 0; }
            8%   { opacity: 1; }
            88%  { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 0; }
          }
          @keyframes reziq-node-${uid} {
            0%,100% { opacity: 0.4; r: 2.2; }
            50%     { opacity: 1;   r: 2.8; }
          }
          @keyframes reziq-fold-${uid} {
            0%,100% { opacity: 0.7; }
            50%     { opacity: 1; }
          }
          @keyframes reziq-dot-${uid} {
            0%,100% { opacity: 0.3; }
            50%     { opacity: 0.9; }
          }

          .rzq-line-${uid} {
            stroke-dasharray: 8 4;
            animation: reziq-stream-${uid} 3s ease-in-out infinite;
          }
          .rzq-line-${uid}:nth-child(1) { animation-delay: 0s;    animation-duration: 2.8s; }
          .rzq-line-${uid}:nth-child(2) { animation-delay: 0.5s;  animation-duration: 3.2s; }
          .rzq-line-${uid}:nth-child(3) { animation-delay: 1.1s;  animation-duration: 2.6s; }
          .rzq-line-${uid}:nth-child(4) { animation-delay: 1.6s;  animation-duration: 3.4s; }
          .rzq-line-${uid}:nth-child(5) { animation-delay: 0.3s;  animation-duration: 3.0s; }
          .rzq-line-${uid}:nth-child(6) { animation-delay: 2.0s;  animation-duration: 2.5s; }

          .rzq-node-${uid} {
            animation: reziq-node-${uid} 2.5s ease-in-out infinite;
          }
          .rzq-node-${uid}:nth-child(2) { animation-delay: 0.4s; }
          .rzq-node-${uid}:nth-child(3) { animation-delay: 0.8s; }
          .rzq-node-${uid}:nth-child(4) { animation-delay: 1.2s; }
          .rzq-node-${uid}:nth-child(5) { animation-delay: 1.6s; }
          .rzq-node-${uid}:nth-child(6) { animation-delay: 2.0s; }

          .rzq-fold-${uid} {
            animation: reziq-fold-${uid} 3s ease-in-out infinite;
          }
        `}</style>
      </defs>

      {/* ── DOCUMENT BODY ─────────────────────────────────────── */}

      {/* Main doc silhouette — corner cut at top-right */}
      <path
        d="M2,3 L26,3 L32,9 L32,46 L2,46 Z"
        fill="#0d110a"
        stroke="#c2f13545"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Corner fold triangle — the "folded back" ear */}
      <path
        d="M26,3 L32,9 L26,9 Z"
        fill={`url(#fold-${uid})`}
        stroke="#c2f13560"
        strokeWidth="0.8"
        strokeLinejoin="round"
        className={`rzq-fold-${uid}`}
      />

      {/* ── GLOWING NODE IN CORNER FOLD ───────────────────────── */}
      {/* This is the "AI brain" — a circuit node revealed by the fold */}
      <circle
        cx="28.5"
        cy="6.5"
        r="2.2"
        fill={`url(#nodeGrad-${uid})`}
        filter={`url(#glow-${uid})`}
        className={`rzq-node-${uid}`}
      />
      {/* Node ring */}
      <circle
        cx="28.5"
        cy="6.5"
        r="3.5"
        fill="none"
        stroke="#c2f13530"
        strokeWidth="0.6"
        className={`rzq-node-${uid}`}
      />

      {/* ── DATA STREAM LINES (inside document) ───────────────── */}
      {/* These replace normal "text lines" on the resume document */}
      <g clipPath={`url(#docClip-${uid})`} filter={`url(#softglow-${uid})`}>

        {/* Line 1 — full width, lime — primary headline */}
        <line
          className={`rzq-line-${uid}`}
          x1="7" y1="15" x2="28" y2="15"
          stroke="#c2f135"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* Line 2 — 3/4 width, dimmer — subheading */}
        <line
          className={`rzq-line-${uid}`}
          x1="7" y1="20" x2="24" y2="20"
          stroke="#c2f13599"
          strokeWidth="1"
          strokeLinecap="round"
        />

        {/* Line 3 — full, teal — body */}
        <line
          className={`rzq-line-${uid}`}
          x1="7" y1="26" x2="28" y2="26"
          stroke="#5ef0c8"
          strokeWidth="0.9"
          strokeLinecap="round"
        />

        {/* Line 4 — short, dimmer — body */}
        <line
          className={`rzq-line-${uid}`}
          x1="7" y1="31" x2="21" y2="31"
          stroke="#5ef0c870"
          strokeWidth="0.9"
          strokeLinecap="round"
        />

        {/* Line 5 — medium, lime dim — footer line */}
        <line
          className={`rzq-line-${uid}`}
          x1="7" y1="37" x2="26" y2="37"
          stroke="#c2f13555"
          strokeWidth="0.8"
          strokeLinecap="round"
        />

        {/* Line 6 — short, dimmer */}
        <line
          className={`rzq-line-${uid}`}
          x1="7" y1="42" x2="18" y2="42"
          stroke="#c2f13533"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </g>

      {/* ── NODE DOTS on line endpoints ────────────────────────── */}
      {/* Small circle nodes where lines "terminate" — neural feel */}
      <g className={`rzq-node-${uid}`} filter={`url(#glow-${uid})`}>
        <circle cx="7"  cy="15" r="1.2" fill="#c2f135" />
        <circle cx="7"  cy="20" r="1.0" fill="#c2f135" />
        <circle cx="7"  cy="26" r="1.0" fill="#5ef0c8" />
        <circle cx="7"  cy="31" r="0.9" fill="#5ef0c8" />
        <circle cx="7"  cy="37" r="0.9" fill="#c2f135" />
        <circle cx="7"  cy="42" r="0.8" fill="#c2f135" />
      </g>

      {/* ── LEFT EDGE ACCENT LINE ──────────────────────────────── */}
      {/* The "spine" — like a neural column */}
      <line
        x1="4.5" y1="12" x2="4.5" y2="44"
        stroke="#c2f13530"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeDasharray="1.5 3"
      />

      {/* ── WORDMARK ──────────────────────────────────────────── */}
      {withText && (
        <text
          x={vw + 5}
          y={vh * 0.72}
          fontFamily="'Bebas Neue', sans-serif"
          fontSize={vh * 0.62}
          fill="#ffffff"
          letterSpacing="2"
        >
          REZIQ
        </text>
      )}
    </svg>
  )
}