const ACTIVITY_REGEX = /activity(?::|%3A)(\d+)/i
const SHIFT_WORKER_AND_SEQUENCE = 22n

function parseBigInt(value) {
  if (value == null) return null
  try {
    if (typeof value === 'bigint') return value
    const normalized = typeof value === 'number' ? BigInt(Math.trunc(value)) : BigInt(String(value).trim())
    return normalized >= 0 ? normalized : null
  } catch {
    return null
  }
}

export function extractActivityId(input) {
  if (input == null) return null
  if (typeof input === 'string') {
    const match = input.match(ACTIVITY_REGEX)
    if (match) {
      return match[1]
    }
  }
  if (typeof input === 'number' || typeof input === 'bigint') {
    return String(input)
  }
  return null
}

export function activityIdToTimestampIso(activityId) {
  const big = parseBigInt(activityId)
  if (!big) return null
  if (big === 0n) return null

  const timestampMsBig = big >> SHIFT_WORKER_AND_SEQUENCE
  const timestampMs = Number(timestampMsBig)
  if (!Number.isFinite(timestampMs)) return null

  const date = new Date(timestampMs)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export function deriveActivityTimestamp(value) {
  const id = extractActivityId(value)
  if (!id) return null
  return activityIdToTimestampIso(id)
}
