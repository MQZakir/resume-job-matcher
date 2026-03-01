import { useState, useRef, useEffect } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * Text scramble effect — randomises characters then resolves to the real text.
 * @param {string} text  — the real text to resolve to
 * @param {boolean} active — trigger the scramble when true
 */
export function useScramble(text, active) {
  const [display, setDisplay] = useState(text)
  const frameRef = useRef(null)

  useEffect(() => {
    if (!active) {
      setDisplay(text)
      return
    }

    let iteration = 0
    clearInterval(frameRef.current)

    frameRef.current = setInterval(() => {
      setDisplay(
        text
          .split('')
          .map((char, i) => {
            if (char === ' ') return ' '
            if (i < iteration) return text[i]
            return CHARS[Math.floor(Math.random() * CHARS.length)]
          })
          .join('')
      )
      iteration += 0.9
      if (iteration >= text.length) clearInterval(frameRef.current)
    }, 24)

    return () => clearInterval(frameRef.current)
  }, [active, text])

  return display
}
