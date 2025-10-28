const EXPLICIT_TYPE_MAP = new Map([
  ['video', 'Video'],
  ['jobs', 'Jobs'],
  ['job', 'Jobs'],
  ['hiring', 'Jobs'],
  ['funding', 'Funding'],
  ['investment', 'Funding'],
  ['newsletter', 'Newsletter'],
  ['regular', 'Regular'],
])

const TEXT_FIELDS = ['title', 'summary', 'description', 'content', 'text', 'body', 'caption']

const JOB_STRONG_PATTERNS = [
  /\bwe'?re hiring\b/,
  /\bnow hiring\b/,
  /\bhiring now\b/,
  /\bhiring alert\b/,
  /\bhiring for\b/,
  /\bopen roles?\b/,
  /\bopen positions?\b/,
  /\bcareer opportunit(?:y|ies)\b/,
  /\bjoin our team\b/,
  /\bapply now\b/,
  /\baccepting applications\b/,
  /\brole available\b/,
  /\bjob openings?\b/,
  /\broles posted\b/,
]

const JOB_WEAK_PATTERNS = [
  /\bhiring\b/,
  /\bjobs\b/,
  /\bhiring list\b/,
  /\bhiring roundup\b/,
]

const FUNDING_PATTERNS = [
  /\bfunding\b/,
  /\brais(?:e|ed|es)\b/,
  /\bseries [a-z]\b/,
  /\bpre-?seed\b/,
  /\bseed round\b/,
  /\bventure capital\b/,
  /\bvc\b/,
  /\binvestment\b/,
  /\bround\b/,
  /\bvaluation\b/,
  /\bipo\b/,
  /\bacquisition\b/,
  /\bmerger\b/,
  /\bdebt facility\b/,
  /\blead investor\b/,
  /\bpending close\b/,
  /\bstrategic investment\b/,
  /\bterm sheet\b/,
]

const FUNDING_CURRENCY_PATTERN = /\b(?:\$|usd|us\$|eur|€|gbp|£)\s?\d[\d,]*(?:\.\d+)?\b/

const NEWSLETTER_PATTERNS = [
  /\bnew issue is live\b/,
  /\bnewsletter\b/,
]

function normalizeString(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function collectText(post) {
  if (!post) return { normalized: '', raw: '' }
  const parts = []
  for (const field of TEXT_FIELDS) {
    const value = post[field]
    if (typeof value === 'string' && value.trim()) {
      parts.push(value.trim())
    }
  }
  const raw = parts.join(' ')
  return { normalized: raw.toLowerCase(), raw }
}

function countPatternMatches(text, pattern) {
  if (!text) return 0
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  const globalPattern = new RegExp(pattern.source, flags)
  const matches = text.match(globalPattern)
  return matches ? matches.length : 0
}

function scorePatterns(text, patterns) {
  if (!text) return 0
  return patterns.reduce((score, pattern) => score + countPatternMatches(text, pattern), 0)
}

function scoreFunding(text) {
  if (!text) return 0
  let score = scorePatterns(text, FUNDING_PATTERNS)
  if (FUNDING_CURRENCY_PATTERN.test(text)) score += 1
  return score
}

function detectCompanyList(rawText) {
  if (!rawText) return 0
  const lines = rawText.split(/\r?\n/)
  let matches = 0
  const listPattern = /^(?:\s*(?:\d{1,3}[.)]|[-*•]))\s+[A-Z0-9][^\n]{2,}/
  for (const line of lines) {
    if (listPattern.test(line)) {
      matches += 1
    }
  }
  if (matches >= 3) {
    return 1 + Math.floor((matches - 3) / 3)
  }
  return 0
}

function scoreJobs(normalizedText, rawText) {
  if (!normalizedText) return 0
  const strong = scorePatterns(normalizedText, JOB_STRONG_PATTERNS)
  const weak = scorePatterns(normalizedText, JOB_WEAK_PATTERNS)
  const listSignal = detectCompanyList(rawText)

  const qualified = strong > 0 || weak >= 2 || (weak >= 1 && listSignal >= 1)
  if (!qualified) return 0

  return strong * 3 + weak + listSignal * 2
}

export function deriveContentType(post) {
  if (!post) return 'Uncategorized'

  const normalizedColumn = normalizeString(
    post.contentTypeColumn ?? post.contentType
  )

  if (EXPLICIT_TYPE_MAP.has(normalizedColumn)) {
    return EXPLICIT_TYPE_MAP.get(normalizedColumn)
  }

  if (normalizedColumn && normalizedColumn.includes('video')) {
    return 'Video'
  }

  const { normalized: text, raw } = collectText(post)
  if (!text) {
    return 'Regular'
  }

  const scores = [
    { type: 'Funding', score: scoreFunding(text) },
    { type: 'Jobs', score: scoreJobs(text, raw) },
    { type: 'Newsletter', score: scorePatterns(text, NEWSLETTER_PATTERNS) },
  ]
  scores.sort((a, b) => b.score - a.score)

  const best = scores[0]
  if (best.score > 0) {
    return best.type
  }

  return 'Regular'
}

export function isVideoContent(contentType) {
  return contentType === 'Video'
}

export function bucketizeContentType(contentType) {
  if (contentType === 'Video') return 'Video'
  if (contentType === 'Jobs') return 'Jobs'
  if (contentType === 'Funding') return 'Funding'
  if (contentType === 'Newsletter') return 'Newsletter'
  return 'Regular'
}
