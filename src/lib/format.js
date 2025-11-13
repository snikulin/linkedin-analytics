export function fmtInt(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v)
}

export function fmtPct(v, digits = 2) {
  if (v == null) return '—'
  return `${(v * 100).toFixed(digits)}%`
}

export function getLinkedInUrl(postLink, companyId) {
  if (!postLink || !companyId) return postLink

  // Extract URN from feed URL
  const urnMatch = postLink.match(/\/feed\/update\/(urn:li:activity:\d+)/)
  if (!urnMatch) return postLink

  const urn = urnMatch[1]
  return `https://www.linkedin.com/company/${companyId}/admin/post-analytics/${urn}`
}

