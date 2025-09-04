export function toIso(d) {
  if (!d) return null
  if (typeof d === 'string') return d
  if (d instanceof Date) return d.toISOString()
  const dt = new Date(d)
  return isNaN(dt) ? null : dt.toISOString()
}

export function dayOfWeekLabel(iso, locale = 'en-US', timeZone = 'Europe/Berlin') {
  const d = iso ? new Date(iso) : null
  if (!d || isNaN(d)) return null
  return d.toLocaleString(locale, { weekday: 'short', timeZone })
}

export function dayOfWeekIndex(iso, timeZone = 'Europe/Berlin') {
  const d = iso ? new Date(iso) : null
  if (!d || isNaN(d)) return null
  // Derive index from localized weekday by mapping order
  const label = d.toLocaleString('en-US', { weekday: 'short', timeZone })
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return map[label] ?? null
}

