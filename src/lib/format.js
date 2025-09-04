export function fmtInt(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v)
}

export function fmtPct(v, digits = 2) {
  if (v == null) return '—'
  return `${(v * 100).toFixed(digits)}%`
}

