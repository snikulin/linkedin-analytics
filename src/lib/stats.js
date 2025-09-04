export function median(arr) {
  if (!arr || arr.length === 0) return null
  const a = arr.slice().sort((a, b) => a - b)
  const mid = Math.floor(a.length / 2)
  if (a.length % 2 === 0) return (a[mid - 1] + a[mid]) / 2
  return a[mid]
}

