export function groupBy(arr, keyFn) {
  const map = new Map()
  for (const item of arr) {
    const k = keyFn(item)
    if (k == null) continue
    const bucket = map.get(k)
    if (bucket) bucket.push(item)
    else map.set(k, [item])
  }
  return map
}

export function toArray(map) {
  return Array.from(map.entries()).map(([key, values]) => ({ key, values }))
}

