import { useState, useEffect } from 'react'

/**
 * Animates a number from 0 to `target` over `duration` ms.
 * @param {number} target
 * @param {number} duration — ms (default 900)
 * @param {boolean} run — start animation when true
 */
export function useCountUp(target, duration = 900, run = true) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!run || target == null) return

    const start = performance.now()
    let raf

    const tick = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, run])

  return value
}
