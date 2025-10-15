import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function lerpColor(start: string, end: string, t: number) {
  const s = start.startsWith("#") ? start.slice(1) : start
  const e = end.startsWith("#") ? end.slice(1) : end

  const sr = parseInt(s.substring(0, 2), 16)
  const sg = parseInt(s.substring(2, 4), 16)
  const sb = parseInt(s.substring(4, 6), 16)

  const er = parseInt(e.substring(0, 2), 16)
  const eg = parseInt(e.substring(2, 4), 16)
  const eb = parseInt(e.substring(4, 6), 16)

  const rr = Math.round(sr + (er - sr) * t)
  const rg = Math.round(sg + (eg - sg) * t)
  const rb = Math.round(sb + (eb - sb) * t)

  return `#${rr.toString(16).padStart(2, "0")}${rg.toString(16).padStart(2, "0")}${rb.toString(16).padStart(2, "0")}`
}
