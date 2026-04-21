/**
 * Validates a string as a safe in-app return path (pathname + optional search).
 * Rejects values that would act as open redirects (e.g. //evil.com).
 */
export function parseSafeInternalReturnPath(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length === 0) return null
  if (!raw.startsWith('/')) return null
  if (raw.startsWith('//')) return null
  if (raw.includes('://')) return null
  return raw
}
