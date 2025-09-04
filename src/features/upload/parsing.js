import * as XLSX from 'xlsx'

const KNOWN_POST_HEADERS = [
  'post title', 'post link', 'post type', 'posted by', 'created date',
  'impressions', 'likes', 'comments', 'reposts', 'engagement rate', 'content type'
]
const KNOWN_DAILY_HEADERS = [
  'date', 'impressions', 'clicks', 'reactions', 'comments', 'shares', 'video views', 'engagement rate'
]

function normalizeHeader(h) {
  return String(h || '')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function parseNumber(v) {
  if (v == null || v === '') return null
  if (typeof v === 'number') return v
  let s = String(v).trim()
  const isPercent = /%$/.test(s)
  s = s.replace(/%/g, '')
  // Remove spaces including NBSP/thin spaces
  s = s.replace(/[\s\u00A0\u202F]/g, '')
  // If there is a comma but no dot, assume comma is decimal separator
  if (s.includes(',') && !s.includes('.')) {
    s = s.replace(',', '.')
  } else {
    // Otherwise, drop thousands commas
    s = s.replace(/,/g, '')
  }
  // Remove any other non-numeric characters (keep - and .)
  s = s.replace(/[^0-9+\-.]/g, '')
  const n = Number(s)
  if (!isFinite(n)) return null
  return isPercent ? n / 100 : n
}

function excelSerialToDate(n) {
  // Excel serial date: days since 1899-12-30, fraction is time of day
  const epoch = Date.UTC(1899, 11, 30)
  const ms = Math.round(n * 24 * 60 * 60 * 1000)
  return new Date(epoch + ms)
}

function parseDate(v) {
  if (!v && v !== 0) return null
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'number') {
    // Likely an Excel serial date
    const d = excelSerialToDate(v)
    return isNaN(d) ? null : d.toISOString()
  }
  const s = String(v).trim()
  // Try numeric string as Excel serial
  if (/^\d+(\.\d+)?$/.test(s)) {
    const d = excelSerialToDate(Number(s))
    return isNaN(d) ? null : d.toISOString()
  }
  const d = new Date(s)
  return isNaN(d) ? null : d.toISOString()
}

function scoreHeaders(headers, known) {
  const set = new Set(headers.map(normalizeHeader))
  let score = 0
  for (const k of known) if (set.has(k)) score += 1
  return score
}

function sheetToRows(ws) {
  // Read sheet as 2D array for header detection
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true })
  if (!rows.length) return { headers: [], data: [] }
  // Find best header row
  let bestIdx = 0
  let bestScore = -1
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const headers = rows[i]
    const score = Math.max(scoreHeaders(headers, KNOWN_POST_HEADERS), scoreHeaders(headers, KNOWN_DAILY_HEADERS))
    if (score > bestScore) {
      bestScore = score
      bestIdx = i
    }
  }
  const headers = rows[bestIdx].map(normalizeHeader)
  const dataRows = rows.slice(bestIdx + 1)
  const data = dataRows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])))
  return { headers, data }
}

function classifySheet(headers) {
  const postScore = scoreHeaders(headers, KNOWN_POST_HEADERS)
  const dailyScore = scoreHeaders(headers, KNOWN_DAILY_HEADERS)
  if (postScore >= dailyScore) return 'posts'
  return 'daily'
}

function normalizePost(rec) {
  const h = (k) => rec[k]
  const out = {
    title: h('post title') ?? h('title') ?? null,
    link: h('post link') ?? h('link') ?? null,
    type: h('post type') ?? h('type') ?? h('content type') ?? null,
    createdAt: parseDate(h('created date') ?? h('date')),
    impressions: parseNumber(h('impressions')) ?? 0,
    likes: parseNumber(h('likes')) ?? 0,
    comments: parseNumber(h('comments')) ?? 0,
    reposts: parseNumber(h('reposts')) ?? parseNumber(h('shares')) ?? 0,
  }
  const er = h('engagement rate')
  if (er != null && er !== '') {
    out.engagementRate = parseNumber(er)
  } else {
    const denom = out.impressions || 0
    const numer = (out.likes || 0) + (out.comments || 0) + (out.reposts || 0)
    out.engagementRate = denom > 0 ? numer / denom : null
  }
  return out
}

function pick(rec, candidates) {
  for (const c of candidates) {
    if (c in rec) return rec[c]
  }
  return undefined
}

function pickByStartsWith(rec, bases) {
  const keys = Object.keys(rec)
  for (const b of bases) {
    const k = keys.find((k) => k.startsWith(b))
    if (k) return rec[k]
  }
  return undefined
}

function normalizeDaily(rec) {
  const date = parseDate(rec['date'])
  const impressionsRaw = pick(rec, [
    'impressions (total)',
    'impressions',
  ]) ?? pickByStartsWith(rec, ['impressions (total', 'impressions'])

  const clicksRaw = pick(rec, ['clicks (total)', 'clicks']) ?? pickByStartsWith(rec, ['clicks (total', 'clicks'])
  const reactionsRaw = pick(rec, ['reactions (total)', 'reactions']) ?? pickByStartsWith(rec, ['reactions (total', 'reactions'])
  const commentsRaw = pick(rec, ['comments (total)', 'comments']) ?? pickByStartsWith(rec, ['comments (total', 'comments'])
  const repostsRaw = pick(rec, ['reposts (total)', 'reposts', 'shares (total)', 'shares']) ?? pickByStartsWith(rec, ['reposts (total', 'reposts', 'shares (total', 'shares'])
  const videoViewsRaw = pick(rec, ['video views']) ?? pickByStartsWith(rec, ['video views'])
  const erRaw = pick(rec, ['engagement rate (total)', 'engagement rate']) ?? pickByStartsWith(rec, ['engagement rate (total', 'engagement rate'])

  return {
    date,
    impressions: parseNumber(impressionsRaw) ?? 0,
    clicks: parseNumber(clicksRaw) ?? null,
    reactions: parseNumber(reactionsRaw) ?? null,
    comments: parseNumber(commentsRaw) ?? null,
    shares: parseNumber(repostsRaw) ?? null,
    videoViews: parseNumber(videoViewsRaw) ?? null,
    engagementRate: parseNumber(erRaw) ?? null,
  }
}

export async function parseFiles(files) {
  const posts = []
  const daily = []
  for (const file of files) {
    const ab = await file.arrayBuffer()
    const wb = XLSX.read(ab, { type: 'array', cellDates: true, cellNF: false, cellText: false })
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName]
      const { headers, data } = sheetToRows(ws)
      if (!headers.length || !data.length) continue
      const kind = classifySheet(headers)
      if (kind === 'posts') {
        for (const rec of data) posts.push(normalizePost(rec))
      } else {
        for (const rec of data) daily.push(normalizeDaily(rec))
      }
    }
  }
  return { posts, daily }
}
