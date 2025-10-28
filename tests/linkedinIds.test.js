import { describe, expect, it } from 'bun:test'

import { deriveActivityTimestamp, activityIdToTimestampIso } from '../src/lib/linkedinIds'

describe('LinkedIn activity ID decoding', () => {
  it('extracts timestamp from LinkedIn feed URL', () => {
    const url = 'https://www.linkedin.com/feed/update/urn:li:activity:7387527938654691329'
    expect(deriveActivityTimestamp(url)).toBe('2025-10-24T16:38:34.207Z')
  })

  it('returns null for malformed identifiers', () => {
    expect(deriveActivityTimestamp('https://example.com/not-an-activity')).toBeNull()
  })

  it('decodes raw numeric IDs via BigInt', () => {
    expect(activityIdToTimestampIso(7387527938654691329n)).toBe('2025-10-24T16:38:34.207Z')
  })
})
