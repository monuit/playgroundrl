'use client'

import { useEffect } from 'react'

// A small client-side component that suppresses repetitive runModel warnings.
// It intentionally only suppresses two known noisy messages used by runModel:
//  - BigInt coercion warnings
//  - Non-finite output sanitization warnings

export default function ConsoleFilter() {
  useEffect(() => {
    const originalWarn = console.warn.bind(console)
    const warned = new Set<string>()

    console.warn = (...args: unknown[]) => {
      try {
        const first = args[0]
        if (typeof first === 'string') {
          if (first.includes('[runModel] Output tensor contains integer (BigInt) values')) {
            const key = 'runModel.bigint.coerce'
            if (warned.has(key)) return
            warned.add(key)
            originalWarn(...args)
            return
          }

          if (first.includes('[runModel] Output tensor contained non-finite values')) {
            const key = 'runModel.nonfinite'
            if (warned.has(key)) return
            warned.add(key)
            originalWarn(...args)
            return
          }
        }
      } catch (e) {
        // If our filter throws, fall back to original behavior
      }

      originalWarn(...args)
    }

    return () => {
      try {
        // Restore original console.warn
        console.warn = originalWarn
      } catch (e) {
        // ignore
      }
    }
  }, [])

  return null
}
