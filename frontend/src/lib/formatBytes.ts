/** Human-readable byte size for UI (binary units). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KiB', 'MiB', 'GiB']
  let n = bytes
  let u = 0
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024
    u += 1
  }
  const digits = u === 0 ? 0 : n < 10 ? 2 : n < 100 ? 1 : 0
  return `${n.toFixed(digits)} ${units[u]}`
}
