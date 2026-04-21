import { describe, it, expect } from 'vitest'
import i18n from '../../i18n'
import { recordDomainFieldLabelForKey, translateRecordFieldKey } from '../../lib/recordFieldLabel'

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

describe('recordDomainFieldLabelForKey', () => {
  const t = i18n.getFixedT('en', 'translation')

  it('disambiguates content child keys like NestedDomainFields', () => {
    expect(recordDomainFieldLabelForKey('activity', 'content', i18n, t)).toBe(
      t('recordForm.labels.contentActivity'),
    )
    expect(recordDomainFieldLabelForKey('activity', undefined, i18n, t)).toBe(
      translateRecordFieldKey('activity', i18n, t),
    )
  })

  it('disambiguates content event row name keys', () => {
    expect(recordDomainFieldLabelForKey('name', 'content_event_row', i18n, t)).toBe(
      t('recordForm.labels.contentSubEventName'),
    )
    expect(recordDomainFieldLabelForKey('name_type', 'content_event_row', i18n, t)).toBe(
      t('recordForm.labels.contentSubEventNameType'),
    )
  })
})
