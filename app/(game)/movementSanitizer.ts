type MovementSanitizerConfig = {
  gridSide: number
  tileSpacing: number
  context: string
}

type MovementSanitizers = {
  sanitizeValue: (label: string, value: number, fallback: number, min: number, max: number) => number
  sanitizeRotation: (value: number, fallback: number) => number
  sanitizeTileCoordinate: (label: string, value: number, fallback: number) => number
  sanitizeTileIndex: (label: string, value: number, fallback: number) => number
  worldBound: number
}

const clampToRange = (value: number, min: number, max: number) => {
  if (value < min) return min
  if (value > max) return max
  return value
}

export const createMovementSanitizers = ({ gridSide, tileSpacing, context }: MovementSanitizerConfig): MovementSanitizers => {
  const warnedLabels = new Set<string>()
  const worldBound = gridSide * tileSpacing
  const tileCount = gridSide * gridSide

  const sanitizeValue = (label: string, value: number, fallback: number, min: number, max: number) => {
    const safeFallback = Number.isFinite(fallback) ? clampToRange(fallback, min, max) : clampToRange(0, min, max)
    if (!Number.isFinite(value)) {
      if (process.env.NODE_ENV !== 'production' && !warnedLabels.has(`${label}:nonfinite`)) {
        console.warn(`[${context}] Non-finite ${label}; falling back to ${safeFallback}.`, value)
        warnedLabels.add(`${label}:nonfinite`)
      }
      return safeFallback
    }

    const clamped = clampToRange(value, min, max)
    if (clamped !== value && process.env.NODE_ENV !== 'production' && !warnedLabels.has(`${label}:clamped`)) {
      console.warn(`[${context}] Clamped ${label} from ${value} to ${clamped}`)
      warnedLabels.add(`${label}:clamped`)
    }

    return clamped
  }

  const sanitizeRotation = (value: number, fallback: number) => {
    const safeFallback = Number.isFinite(fallback) ? fallback : 0
    if (!Number.isFinite(value)) {
      if (process.env.NODE_ENV !== 'production' && !warnedLabels.has('rotation:nonfinite')) {
        console.warn(`[${context}] Non-finite rotation; falling back to ${safeFallback}.`, value)
        warnedLabels.add('rotation:nonfinite')
      }
      return safeFallback
    }

    return clampToRange(value, -Math.PI, Math.PI)
  }

  const sanitizeTileCoordinate = (label: string, value: number, fallback: number) => {
    const safeFallback = Number.isFinite(fallback) ? fallback : 0
    const normalizedFallback = clampToRange(safeFallback, 0, gridSide - 1)
    if (!Number.isFinite(value)) {
      if (process.env.NODE_ENV !== 'production' && !warnedLabels.has(`${label}:tile:nonfinite`)) {
        console.warn(`[${context}] Non-finite ${label}; falling back to ${normalizedFallback}.`, value)
        warnedLabels.add(`${label}:tile:nonfinite`)
      }
      return Math.round(normalizedFallback)
    }

    const clamped = clampToRange(value, 0, gridSide - 1)
    return Math.round(clamped)
  }

  const sanitizeTileIndex = (label: string, value: number, fallback: number) => {
    const safeFallback = Number.isFinite(fallback) ? fallback : 0
    const normalizedFallback = clampToRange(safeFallback, 0, tileCount - 1)

    if (!Number.isFinite(value)) {
      if (process.env.NODE_ENV !== 'production' && !warnedLabels.has(`${label}:index:nonfinite`)) {
        console.warn(`[${context}] Non-finite ${label}; falling back to ${normalizedFallback}.`, value)
        warnedLabels.add(`${label}:index:nonfinite`)
      }
      return Math.round(normalizedFallback)
    }

    const clamped = clampToRange(value, 0, tileCount - 1)
    return Math.round(clamped)
  }

  return {
    sanitizeValue,
    sanitizeRotation,
    sanitizeTileCoordinate,
    sanitizeTileIndex,
    worldBound,
  }
}
