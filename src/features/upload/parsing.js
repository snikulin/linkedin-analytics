import * as XLSX from 'xlsx'
import { deriveContentType } from '../../lib/contentClassification'
import { deriveActivityTimestamp, extractActivityId } from '../../lib/linkedinIds'
import { composePostText, computeFingerprint } from '../../lib/postFingerprint'

const KNOWN_POST_HEADERS = [
  'post title', 'post link', 'post type', 'posted by', 'created date',
  'impressions', 'likes', 'comments', 'reposts', 'engagement rate', 'content type'
]
const KNOWN_DAILY_HEADERS = [
  'date', 'impressions', 'clicks', 'reactions', 'comments', 'shares', 'video views', 'engagement rate'
]
const KNOWN_FOLLOWERS_DAILY_HEADERS = [
  'date', 'sponsored followers', 'organic followers', 'auto-invited followers', 'total followers'
]
const KNOWN_FOLLOWERS_DEMOGRAPHIC_HEADERS = [
  'location', 'total followers',
  'job function', 'total followers',
  'seniority', 'total followers',
  'industry', 'total followers',
  'company size', 'total followers'
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

function sheetToRows(worksheet) {
  // Convert worksheet to JSON with raw values to preserve data types
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true })
  
  if (!jsonData.length) return { headers: [], data: [] }
  
  // Find best header row
  let bestIdx = 0
  let bestScore = -1
  for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
    const headers = jsonData[i]
    const score = Math.max(scoreHeaders(headers, KNOWN_POST_HEADERS), scoreHeaders(headers, KNOWN_DAILY_HEADERS))
    if (score > bestScore) {
      bestScore = score
      bestIdx = i
    }
  }
  const headers = jsonData[bestIdx].map(normalizeHeader)
  const dataRows = jsonData.slice(bestIdx + 1)
  const data = dataRows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])))
  return { headers, data }
}

function classifySheet(headers) {
  const postScore = scoreHeaders(headers, KNOWN_POST_HEADERS)
  const dailyScore = scoreHeaders(headers, KNOWN_DAILY_HEADERS)
  const followersDailyScore = scoreHeaders(headers, KNOWN_FOLLOWERS_DAILY_HEADERS)
  const followersDemographicScore = scoreHeaders(headers, KNOWN_FOLLOWERS_DEMOGRAPHIC_HEADERS)

  const maxScore = Math.max(postScore, dailyScore, followersDailyScore, followersDemographicScore)

  if (maxScore === 0) return 'unknown'

  if (postScore === maxScore) return 'posts'
  if (dailyScore === maxScore) return 'daily'
  if (followersDailyScore === maxScore) return 'followers_daily'
  if (followersDemographicScore === maxScore) return 'followers_demographics'

  return 'unknown'
}

function normalizePost(rec) {
  const h = (k) => rec[k]
  const rawPostType = h('post type') ?? h('type') ?? null
  const rawContentType = h('content type') ?? null
  const rawLink = h('post link') ?? h('link') ?? null
  const rawIdentifier = rawLink ?? h('post id') ?? h('id') ?? null
  const activityTimestamp = deriveActivityTimestamp(rawIdentifier)
  const activityId = extractActivityId(rawIdentifier)
  const fallbackDate = parseDate(h('created date') ?? h('date'))
  const fullText = composePostText(rec) || (h('post title') ?? h('title') ?? '')
  const fingerprint = computeFingerprint(fullText, rawPostType ?? rawContentType)
  const out = {
    title: h('post title') ?? h('title') ?? null,
    link: rawLink,
    type: rawPostType ?? rawContentType,
    createdAt: activityTimestamp ?? fallbackDate,
    activityId: activityId ?? null,
    fullText,
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
  out.contentType = deriveContentType({
    title: out.title,
    contentTypeColumn: rawContentType,
  })

  Object.assign(out, fingerprint)
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

function normalizeFollowersDaily(rec) {
  const date = parseDate(rec['date'])
  const sponsoredFollowers = parseNumber(rec['sponsored followers']) ?? 0
  const organicFollowers = parseNumber(rec['organic followers']) ?? 0
  const autoInvitedFollowers = parseNumber(rec['auto-invited followers']) ?? 0
  const totalFollowers = parseNumber(rec['total followers']) ?? 0

  return {
    date,
    sponsoredFollowers,
    organicFollowers,
    autoInvitedFollowers,
    totalFollowers
  }
}

function normalizeFollowersDemographics(rec, sheetName) {
  // Determine the category type based on sheet name or headers
  let categoryType = 'unknown'
  let category = ''
  let count = 0

  if (sheetName.toLowerCase().includes('location')) {
    categoryType = 'location'
    category = rec['location'] || ''
    count = parseNumber(rec['total followers']) ?? 0
  } else if (sheetName.toLowerCase().includes('job function')) {
    categoryType = 'job_function'
    category = rec['job function'] || ''
    count = parseNumber(rec['total followers']) ?? 0
  } else if (sheetName.toLowerCase().includes('seniority')) {
    categoryType = 'seniority'
    category = rec['seniority'] || ''
    count = parseNumber(rec['total followers']) ?? 0
  } else if (sheetName.toLowerCase().includes('industry')) {
    categoryType = 'industry'
    category = rec['industry'] || ''
    count = parseNumber(rec['total followers']) ?? 0
  } else if (sheetName.toLowerCase().includes('company size')) {
    categoryType = 'company_size'
    category = rec['company size'] || ''
    count = parseNumber(rec['total followers']) ?? 0
  }

  return {
    categoryType,
    category,
    count
  }
}

function validateFile(file) {
  // Validate file type and size to mitigate security risks
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv'
  ]
  const maxSize = 50 * 1024 * 1024 // 50MB limit
  
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
    throw new Error(`Invalid file type: ${file.type}. Only Excel and CSV files are allowed.`)
  }
  
  if (file.size > maxSize) {
    throw new Error(`File too large: ${file.size} bytes. Maximum size is 50MB.`)
  }
  
  return true
}

async function parseCSV(file) {
  // For CSV files, we'll use a simple text parser since ExcelJS doesn't handle CSV as well
  const text = await file.text()
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length === 0) return { headers: [], data: [] }
  
  // Parse CSV manually (simple approach)
  const parseCSVRow = (line) => {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }
  
  const rows = lines.map(parseCSVRow)
  if (rows.length === 0) return { headers: [], data: [] }
  
  const headers = rows[0].map(normalizeHeader)
  const dataRows = rows.slice(1)
  const data = dataRows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])))
  
  return { headers, data }
}

export async function parseFiles(files) {
  const posts = []
  const daily = []
  const followersDaily = []
  const followersDemographics = []

  for (const file of files) {
    try {
      // Validate file before processing
      validateFile(file)
      
      let workbook
      const isCSV = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/csv'
      
      if (isCSV) {
        // Handle CSV files
        const { headers, data } = await parseCSV(file)
        if (!headers.length || !data.length) continue
        
        // Limit data size to prevent DoS
        if (data.length > 100000) {
          console.warn(`CSV file has too many rows (${data.length}), limiting to 100,000`)
          data.length = 100000
        }
        
        const kind = classifySheet(headers)
        if (kind === 'posts') {
          for (const rec of data) posts.push(normalizePost(rec))
        } else if (kind === 'daily') {
          for (const rec of data) daily.push(normalizeDaily(rec))
        } else if (kind === 'followers_daily') {
          for (const rec of data) followersDaily.push(normalizeFollowersDaily(rec))
        } else if (kind === 'followers_demographics') {
          for (const rec of data) {
            const normalized = normalizeFollowersDemographics(rec, 'CSV')
            if (normalized.categoryType !== 'unknown') {
              followersDemographics.push(normalized)
            }
          }
        }
        continue
      }
      
      // Handle Excel files with SheetJS
      const ab = await file.arrayBuffer()
      workbook = XLSX.read(ab, { type: 'array' })
      
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        if (!worksheet) continue
        
        const { headers, data } = sheetToRows(worksheet)
        if (!headers.length || !data.length) continue
        
        // Limit data size to prevent DoS
        if (data.length > 100000) {
          console.warn(`Worksheet ${sheetName} has too many rows (${data.length}), limiting to 100,000`)
          data.length = 100000
        }
        
        const kind = classifySheet(headers)
        if (kind === 'posts') {
          for (const rec of data) posts.push(normalizePost(rec))
        } else if (kind === 'daily') {
          for (const rec of data) daily.push(normalizeDaily(rec))
        } else if (kind === 'followers_daily') {
          for (const rec of data) followersDaily.push(normalizeFollowersDaily(rec))
        } else if (kind === 'followers_demographics') {
          for (const rec of data) {
            const normalized = normalizeFollowersDemographics(rec, sheetName)
            if (normalized.categoryType !== 'unknown') {
              followersDemographics.push(normalized)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing file:', file.name, error)
      // Continue processing other files instead of failing completely
      continue
    }
  }
  return { posts, daily, followersDaily, followersDemographics }
}

export const __uploadTestHelpers = {
  normalizePost,
}
