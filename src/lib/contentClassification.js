function normalizeString(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function deriveContentType(post) {
  if (!post) return 'Uncategorized'

  const normalizedColumn = normalizeString(
    post.contentTypeColumn ?? post.contentType
  )

  if (normalizedColumn === 'video') return 'Video'
  if (normalizedColumn === 'jobs') return 'Jobs'
  if (normalizedColumn === 'regular') return 'Regular'

  if (normalizedColumn && normalizedColumn.includes('video')) {
    return 'Video'
  }

  const title = normalizeString(post.title)
  if (title) {
    const jobPatterns = [
      /\bwe'?re hiring\b/,
      /\bnow hiring\b/,
      /\bhiring\b/,
      /\bjob\b/,
      /\bjobs\b/,
      /\bopen role\b/,
      /\bopen roles\b/,
      /\bopen position\b/,
      /\bopen positions\b/,
      /\bcareer opportunity\b/,
      /\bjoin our team\b/,
    ]

    const fundingPatterns = [
      /\bfunding\b/,
      /\braised?\b/,
      /\bseries [a-z]\b/,
      /\bseed round\b/,
      /\bventure capital\b/,
      /\bvc\b/,
      /\binvestment\b/,
      /\bround\b/,
      /\bvaluation\b/,
      /\bipo\b/,
      /\bacquisition\b/,
      /\bmerger\b/,
    ]

    const newsletterPatterns = [
      /\bnew issue is live\b/,
      /\bnewsletter\b/,
    ]

    if (jobPatterns.some((pattern) => pattern.test(title))) {
      return 'Jobs'
    }

    if (fundingPatterns.some((pattern) => pattern.test(title))) {
      return 'Funding'
    }

    if (newsletterPatterns.some((pattern) => pattern.test(title))) {
      return 'Newsletter'
    }
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
