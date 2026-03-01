import { useEffect, useRef, useState } from 'react'

/**
 * Returns true once the element enters the viewport.
 * @param {IntersectionObserverInit} options
 */
export function useInView(options = { threshold: 0.1 }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        observer.disconnect()
      }
    }, options)

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, inView]
}
