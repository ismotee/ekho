import { describe, it, expect } from 'vitest'
import { getRecordCardSummary } from '../../types/record'

describe('getRecordCardSummary', () => {
  it('prefers title, then object name, then object number, else Untitled', () => {
    expect(
      getRecordCardSummary({
        data: { identification_details: { title: [{ value: '  Mona Lisa  ' }] } },
        representative_image: null,
      }).primaryLabel
    ).toBe('Mona Lisa')

    expect(
      getRecordCardSummary({
        data: {
          identification_details: {
            object_name: [{ value: 'Vase' }],
            object_number: 'INV-9',
          },
        },
        representative_image: null,
      }).primaryLabel
    ).toBe('Vase')

    expect(
      getRecordCardSummary({
        data: { identification_details: { object_number: 'INV-9' } },
        representative_image: null,
      }).primaryLabel
    ).toBe('INV-9')

    expect(
      getRecordCardSummary({ data: {}, representative_image: null }).primaryLabel
    ).toBe('Untitled record')
  })

  it('builds secondary line from object type only', () => {
    expect(
      getRecordCardSummary({
        data: {
          identification_details: {
            title: [{ value: 'Study' }],
            object_type: 'painting',
            object_number: 'A-1',
          },
        },
        representative_image: null,
      }).secondaryLine
    ).toBe('painting')

    expect(
      getRecordCardSummary({
        data: {
          identification_details: {
            object_number: 'A-1',
          },
        },
        representative_image: null,
      }).secondaryLine
    ).toBeUndefined()
  })

  it('uses legacy Year line then acquisition temporal', () => {
    expect(
      getRecordCardSummary({
        data: {
          description: { content: { description: 'Year: 1999' } },
          aquisition_details: { date: [{ text: '1920' }] },
        },
        representative_image: null,
      }).yearLine
    ).toBe('1999')

    expect(
      getRecordCardSummary({
        data: {
          aquisition_details: { date: [{ text: '1920' }] },
        },
        representative_image: null,
      }).yearLine
    ).toBe('1920')

    expect(
      getRecordCardSummary({
        data: {
          aquisition_details: { date: [{ note: '1921' }] },
        },
        representative_image: null,
      }).yearLine
    ).toBe('1921')
  })

  it('exposes thumbnail and trimmed collection name', () => {
    const s = getRecordCardSummary({
      data: {},
      representative_image: 'https://example.com/x.jpg',
      collection_name: '  My coll  ',
    })
    expect(s.thumbnailUrl).toBe('https://example.com/x.jpg')
    expect(s.collectionName).toBe('My coll')
  })
})
