import { describe, it, expect } from 'vitest'
import { objectLocationHasPersistableContent } from '../../lib/objectLocationPayload'

describe('objectLocationHasPersistableContent', () => {
  it('is false for empty object', () => {
    expect(objectLocationHasPersistableContent({})).toBe(false)
  })

  it('is true when spatial location has name', () => {
    expect(objectLocationHasPersistableContent({ location: { name: { fi: 'Helsinki' } } })).toBe(true)
  })

  it('is true when date has text', () => {
    expect(objectLocationHasPersistableContent({ date: { text: '2020' } })).toBe(true)
  })
})
