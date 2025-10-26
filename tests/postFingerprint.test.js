import { describe, expect, it } from 'bun:test'

import { composePostText, computeFingerprint } from '../src/lib/postFingerprint'

describe('post fingerprint helpers', () => {
  it('prioritizes rich body fields when composing text', () => {
    const rec = {
      'post body': 'Detailed body text',
      'post title': 'Title text',
    }
    expect(composePostText(rec)).toBe('Detailed body text')
  })

  it('calculates counts for hashtags, emojis, and links', () => {
    const text = 'Hiring now! Apply now 👉 https://example.com #Robotics #AI'
    const fingerprint = computeFingerprint(text, 'video')

    expect(fingerprint.wordCount).toBeGreaterThan(0)
    expect(fingerprint.hashtagCount).toBe(2)
    expect(fingerprint.linkCount).toBe(1)
    expect(fingerprint.emojiCount).toBe(1)
    expect(fingerprint.ctaCount).toBe(1)
    expect(fingerprint.hasMedia).toBe(true)
  })
})
