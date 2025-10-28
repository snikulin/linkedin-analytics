import { describe, expect, it } from 'bun:test'

import { __uploadTestHelpers } from '../src/features/upload/parsing'

const { normalizePost } = __uploadTestHelpers

describe('normalizePost date handling', () => {
  it('prefers activity ID timestamp when present', () => {
    const rec = {
      'post title': 'Automation update',
      'post link': 'https://www.linkedin.com/feed/update/urn:li:activity:7387527938654691329',
      'created date': 'Oct 20, 2025',
    }

    const normalized = normalizePost(rec)
    expect(normalized.createdAt).toBe('2025-10-24T16:38:34.207Z')
    expect(normalized.activityId).toBe('7387527938654691329')
    expect(normalized.wordCount).toBeGreaterThan(0)
  })

  it('falls back to provided created date when ID missing', () => {
    const rec = {
      'post title': 'Ops update',
      'post link': 'https://www.linkedin.com/feed/update/not-an-id',
      'created date': '2025-10-18T00:00:00Z',
    }

    const normalized = normalizePost(rec)
    expect(normalized.createdAt).toBe('2025-10-18T00:00:00.000Z')
    expect(normalized.activityId).toBeNull()
  })
})
