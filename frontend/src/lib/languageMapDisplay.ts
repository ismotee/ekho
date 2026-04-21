/**
 * Plain multilingual maps like { fi: "savu", en: "smoke" } (no nesting).
 * Used in record detail to avoid drilling fi/en as separate tiles and to show one string by UI language.
 */

/** BCP 47–style language subtags we accept as map keys (fi, en, und, en-US, …). */
const LANGUAGE_MAP_KEY = /^[a-z]{2,3}(-[A-Za-z]{2,8})*$/i

export function isLanguageMapObject(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj)
  if (keys.length === 0) return false
  for (const k of keys) {
    if (!LANGUAGE_MAP_KEY.test(k)) return false
    const v = obj[k]
    if (v === null || v === undefined) return false
    if (!(typeof v === 'string' || typeof v === 'number')) return false
  }
  return true
}

/**
 * Pick one display string: current UI language first, then fi, en, und, then any remaining key (sorted).
 */
export function pickLanguageMapString(obj: Record<string, unknown>, languageTag: string): string | null {
  const primary = languageTag.split('-')[0].toLowerCase()
  const tryKeys = [...new Set([primary, 'fi', 'en', 'und'])]
  for (const k of tryKeys) {
    if (!Object.prototype.hasOwnProperty.call(obj, k)) continue
    const v = obj[k]
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  for (const k of Object.keys(obj).sort()) {
    if (tryKeys.includes(k)) continue
    const v = obj[k]
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}
