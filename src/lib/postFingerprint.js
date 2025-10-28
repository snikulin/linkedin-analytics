const CTA_PATTERNS = [
  /apply now/gi,
  /sign up/gi,
  /book a demo/gi,
  /get started/gi,
  /join the waitlist/gi,
  /download (?:the )?(?:guide|whitepaper|report)/gi,
  /register today/gi,
  /learn more/gi,
]

const LINK_REGEX = /https?:\/\/[^\s)]+/gi
const HASHTAG_REGEX = /#[\p{L}0-9_]+/giu
const MENTION_REGEX = /@[\w.%-]+/g
const SENTENCE_REGEX = /[^.!?]+[.!?]?/g
const EMOJI_REGEX = /[\p{Extended_Pictographic}]/gu

function safeText(value) {
  if (typeof value === 'string') return value
  return ''
}

function countMatches(text, regex) {
  if (!text) return 0
  const matches = text.match(regex)
  return matches ? matches.length : 0
}

export function composePostText(rec) {
  if (!rec) return ''
  const fields = ['post body', 'body', 'text', 'content', 'post text', 'description', 'post title', 'title']
  for (const field of fields) {
    if (rec[field]) {
      const value = safeText(rec[field])
      if (value.trim()) return value
    }
  }
  return ''
}

export function computeFingerprint(text, typeHint) {
  const safe = safeText(text)
  const normalized = safe.trim()

  const words = normalized ? normalized.split(/\s+/).filter(Boolean) : []
  const sentences = normalized ? normalized.match(SENTENCE_REGEX) || [] : []

  const wordCount = words.length
  const charCount = normalized.length
  const sentenceCount = sentences.filter((s) => s.trim().length > 0).length
  const emojiCount = countMatches(normalized, EMOJI_REGEX)
  const hashtagCount = countMatches(normalized, HASHTAG_REGEX)
  const mentionCount = countMatches(normalized, MENTION_REGEX)
  const linkCount = countMatches(normalized, LINK_REGEX)
  const ctaCount = CTA_PATTERNS.reduce((sum, pattern) => sum + countMatches(normalized, pattern), 0)

  const hasMedia = Boolean(typeHint && /video|image|rich|carousel|document/i.test(typeHint))

  return {
    wordCount,
    charCount,
    sentenceCount,
    emojiCount,
    hashtagCount,
    mentionCount,
    linkCount,
    ctaCount,
    hasMedia,
  }
}
