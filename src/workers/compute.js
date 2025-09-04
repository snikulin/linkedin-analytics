// Simple compute worker stub using d3-array when available
/* eslint-disable no-restricted-globals */

let d3array

self.onmessage = async (e) => {
  const { id, action, payload } = e.data || {}
  try {
    if (!d3array) {
      // dynamic import if bundler supports worker deps
      d3array = await import('d3-array')
    }

    switch (action) {
      case 'median': {
        const { values } = payload
        const m = d3array.median(values)
        postMessage({ id, ok: true, data: m })
        break
      }
      default:
        postMessage({ id, ok: false, error: 'unknown_action' })
    }
  } catch (err) {
    postMessage({ id, ok: false, error: String(err) })
  }
}

