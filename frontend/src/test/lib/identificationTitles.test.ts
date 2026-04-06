import { describe, it, expect } from 'vitest'
import {
  firstTitleValueTrimmed,
  identificationTitlesAsList,
} from '../../lib/identificationTitles'

describe('identificationTitles', () => {
  it('identificationTitlesAsList normalizes legacy single Title', () => {
    expect(identificationTitlesAsList(undefined)).toEqual([])
    expect(identificationTitlesAsList([{ value: 'a' }])).toEqual([{ value: 'a' }])
    expect(identificationTitlesAsList({ value: 'legacy' })).toEqual([{ value: 'legacy' }])
  })

  it('firstTitleValueTrimmed returns first non-empty value', () => {
    expect(firstTitleValueTrimmed([])).toBe('')
    expect(firstTitleValueTrimmed([{}, { value: '  x  ' }])).toBe('x')
    expect(firstTitleValueTrimmed({ value: 'one' })).toBe('one')
  })
})
