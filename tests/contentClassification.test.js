import { describe, expect, it } from 'bun:test'

import { deriveContentType } from '../src/lib/contentClassification'

describe('deriveContentType', () => {
  it('prioritizes funding context over incidental job mentions', () => {
    const post = {
      title: `$99,997 committed: On Oct 21, 2025, Humanoid Global Holdings said it will make a strategic investment in Formic. Small check, sharp signal. If you're running case packing, palletizing, welding or floor-sweeping jobs, the economics are getting hard to ignore.`,
    }

    expect(deriveContentType(post)).toBe('Funding')
  })

  it('flags classic hiring announcements as Jobs', () => {
    const post = {
      title: 'We’re hiring! Open roles across engineering, design, and GTM. Apply now.',
    }

    expect(deriveContentType(post)).toBe('Jobs')
  })

  it('respects an explicit content type column value when present', () => {
    const post = {
      title: 'Quarterly product walkthrough',
      contentTypeColumn: 'video',
    }

    expect(deriveContentType(post)).toBe('Video')
  })

  it('classifies hiring roundups with company lists as Jobs', () => {
    const post = {
      title: `40 robotics companies hiring now (roles posted in the last 7 days)-from autonomy to humanoids.\n1. FieldAI - perception and autonomy stack\n2. micro1 - AI engineering platform for teams\n3. Terranova - off-road autonomy and mapping\n4. ASRobotix - robot arms and automation cells`,
    }

    expect(deriveContentType(post)).toBe('Jobs')
  })

  it('treats analytical posts mentioning hiring once as Regular', () => {
    const post = {
      title: `Amazon's "Blue Jay" arm consolidates three stations. Reporting suggests automation could avoid hiring 160k roles by 2027, but this is about ops redesign, not recruiting.`,
      description: `Blue Jay pilots in South Carolina as of Oct 22, 2025. Focus is on dwell time, not job postings.`,
    }

    expect(deriveContentType(post)).toBe('Regular')
  })
})
