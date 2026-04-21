import { describe, expect, it } from 'vitest'
import { isLanguageMapObject, pickLanguageMapString } from '../../lib/languageMapDisplay'

describe('languageMapDisplay', () => {
  it('detects plain language maps', () => {
    expect(isLanguageMapObject({ fi: 'a', en: 'b' })).toBe(true)
    expect(isLanguageMapObject({ und: 'x' })).toBe(true)
    expect(isLanguageMapObject({})).toBe(false)
    expect(isLanguageMapObject({ fi: 'a', code: 'x' })).toBe(false)
    expect(isLanguageMapObject({ fi: { nested: 1 } })).toBe(false)
  })

  it('picks by language tag with fallbacks', () => {
    expect(pickLanguageMapString({ fi: 'savu', en: 'smoke' }, 'fi')).toBe('savu')
    expect(pickLanguageMapString({ fi: 'savu', en: 'smoke' }, 'en')).toBe('smoke')
    expect(pickLanguageMapString({ en: 'only' }, 'fi')).toBe('only')
  })
})
