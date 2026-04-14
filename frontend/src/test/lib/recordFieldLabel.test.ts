import { describe, it, expect } from 'vitest'
import i18n from '../../i18n'
import { translateRecordFieldKey } from '../../lib/recordFieldLabel'

describe('translateRecordFieldKey', () => {
  const t = i18n.getFixedT('en', 'translation')

  it('maps history ownership exchange group and fields like the edit form', () => {
    expect(translateRecordFieldKey('exchange', i18n, t)).toBe('Exchange')
    expect(translateRecordFieldKey('price', i18n, t)).toBe('Exchange price')
    expect(translateRecordFieldKey('denomination', i18n, t)).toBe('Price denomination')
    expect(translateRecordFieldKey('owner', i18n, t)).toBe('Owner (actor)')
  })

  it('maps nested object history event label', () => {
    expect(translateRecordFieldKey('event', i18n, t)).toBe('Event related to the object')
  })
})
