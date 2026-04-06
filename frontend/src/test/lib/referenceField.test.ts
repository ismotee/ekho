import { describe, it, expect } from 'vitest'
import { referenceFieldFi, referenceFieldToPayload, referenceSelectOptions } from '../../lib/referenceField'

describe('referenceField', () => {
  it('referenceFieldFi reads string, pref_label.fi, and legacy label', () => {
    expect(referenceFieldFi(undefined)).toBe('')
    expect(referenceFieldFi('  foo  ')).toBe('foo')
    expect(referenceFieldFi({ pref_label: { fi: 'bar' } })).toBe('bar')
    expect(referenceFieldFi({ label: 'baz' } as never)).toBe('baz')
  })

  it('referenceFieldToPayload returns undefined for blank', () => {
    expect(referenceFieldToPayload('')).toBeUndefined()
    expect(referenceFieldToPayload('   ')).toBeUndefined()
    expect(referenceFieldToPayload('x')).toEqual({ pref_label: { fi: 'x' } })
  })

  it('referenceSelectOptions prepends unknown current value', () => {
    expect(referenceSelectOptions(['a', 'b'], '')).toEqual(['a', 'b'])
    expect(referenceSelectOptions(['a', 'b'], 'a')).toEqual(['a', 'b'])
    expect(referenceSelectOptions(['a', 'b'], 'legacy')).toEqual(['legacy', 'a', 'b'])
  })
})
