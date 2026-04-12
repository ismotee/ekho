import { describe, it, expect } from 'vitest'
import { compactRecordPayloadForSave } from '../../lib/compactRecordPayloadForSave'
import { normalizeObjectProductionInformationList } from '../../lib/historyPayload'
import { referenceFieldFi } from '../../lib/referenceField'
import type { RecordPayload } from '../../types/record'

describe('compactRecordPayloadForSave', () => {
  it('strips legacy identification_details.collection (collection is Record FK only)', () => {
    const data = {
      identification_details: {
        title: [{ value: 'A' }],
        collection: { collection_id: 99 },
      },
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.identification_details?.title).toEqual([{ value: 'A' }])
    expect(out.identification_details).not.toHaveProperty('collection')
  })

  it('drops empty title and object_name rows', () => {
    const data = {
      identification_details: {
        title: [{ value: 'A' }, {}],
        object_name: [{}, { value: 'nick' }],
        object_number: 'N1',
      },
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.identification_details?.title).toEqual([{ value: 'A' }])
    expect(out.identification_details?.object_name).toEqual([
      { value: 'nick', language: { pref_label: { fi: 'suomi' } } },
    ])
  })

  it('drops acquisition date rows with no persistable temporal content', () => {
    const data = {
      aquisition_details: {
        reference_number: 'R',
        date: [{ text: '2020' }, { text: '' }, { text: '  ' }],
      },
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.aquisition_details?.date).toEqual([{ note: '2020' }])
  })

  it('drops empty acquisition place and actor rows and strips acquisition when only placeholders remain', () => {
    const data = {
      aquisition_details: {
        place: [{}, { name: { fi: 'Helsinki' } }],
        actor: [{}, { organization: { name: [{ name: { fi: 'Museo' } }] } }],
      },
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.aquisition_details?.place).toEqual([{ name: { fi: 'Helsinki' } }])
    expect(out.aquisition_details?.actor).toEqual([{ organization: { name: [{ name: { fi: 'Museo' } }] } }])
  })

  it('keeps acquisition actor catalog references', () => {
    const data = {
      aquisition_details: {
        actor: [{}, { id: 42 }],
      },
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.aquisition_details?.actor).toEqual([{ id: 42 }])
  })

  it('keeps acquisition actor role with catalog ref', () => {
    const data = {
      aquisition_details: {
        actor: [
          {
            actor: { id: 42 },
            acquisition_actor_role: { pref_label: { fi: 'lahjoittaja' } },
          },
        ],
      },
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.aquisition_details?.actor).toEqual([
      {
        actor: { id: 42 },
        acquisition_actor_role: { pref_label: { fi: 'lahjoittaja' } },
      },
    ])
  })

  it('removes acquisition when compacted lists and text are empty', () => {
    const data = {
      aquisition_details: {
        place: [{}],
        actor: [{}],
        date: [{ text: '' }],
      },
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.aquisition_details).toBeUndefined()
  })

  it('drops empty description measurement rows and clears description when nothing remains', () => {
    const data = {
      description: {
        physical_description: { text: 'Solid' },
        technical_attribute: [{}, { value: 12, unit: { pref_label: { fi: 'leveys' } } }],
        dimension: [{ value_qualifier: '   ' }],
      },
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.description?.technical_attribute).toEqual([{ value: 12, unit: { pref_label: { fi: 'leveys' } } }])
    expect(out.description?.dimension).toBeUndefined()
    expect(out.description?.physical_description?.text).toBe('Solid')
  })

  it('drops empty object_component rows and strips legacy object_component_name on save', () => {
    const data = {
      description: {
        physical_description: {
          object_component_name: { pref_label: { fi: 'kehys' } },
          object_component: [
            {},
            {
              description: 'Corner',
              object_name: { value: { pref_label: { fi: 'maalaukset' } } },
              object_number: 'OC-1',
            },
          ],
        },
      },
    }
    const out = compactRecordPayloadForSave(data)
    expect((out.description?.physical_description as Record<string, unknown>)?.object_component_name).toBeUndefined()
    expect(out.description?.physical_description?.object_component).toEqual([
      {
        description: 'Corner',
        object_name: {
          value: { pref_label: { fi: 'maalaukset' } },
          language: { pref_label: { fi: 'suomi' } },
        },
        object_number: 'OC-1',
      },
    ])
  })

  it('removes description when compacted domain is empty', () => {
    const data = {
      description: {
        material: [{}],
        content: { note: '  ' },
      },
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.description).toBeUndefined()
  })

  it('compacts history usage_history and drops empty owner placeholders', () => {
    const data = {
      history: {
        usage_history: [{ usage: '', note: '' }, { usage_instructions: 'Handle with care' }],
        owner_history: [{}],
      },
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.history?.usage_history).toEqual([{ usage_instructions: 'Handle with care' }])
    expect(out.history?.owner_history).toBeUndefined()
  })

  it('keeps history owner_history when row has owner', () => {
    const data = {
      history: {
        owner_history: [{ owner: { organization: { name: [{ name: { fi: 'Museum' } }] } } }],
      },
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.history?.owner_history).toEqual([
      { owner: { organization: { name: [{ name: { fi: 'Museum' } }] } } },
    ])
  })

  it('compacts rights holders and drops rights when only placeholders remain', () => {
    const data = {
      rights: [
        {
          type: { pref_label: { fi: 'tekijänoikeus' } },
          holder: [{}, { organization: { name: [{ name: { fi: 'Artist' } }] } }],
          begin_date: { text: '  ' },
          end_date: { text: '2020' },
        },
      ],
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.rights?.[0]?.holder).toEqual([{ organization: { name: [{ name: { fi: 'Artist' } }] } }])
    expect(out.rights?.[0]?.begin_date).toBeUndefined()
    expect(out.rights?.[0]?.end_date).toEqual({ note: '2020' })
  })

  it('removes rights when compacted domain is empty', () => {
    const data = {
      rights: [
        {
          holder: [{}],
          begin_date: { text: '' },
        },
      ],
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.rights).toBeUndefined()
  })

  it('compacts legacy single-object rights into a list', () => {
    const data = {
      rights: {
        note: 'Keep',
      },
    } as import('../../types/record').RecordPayload
    const out = compactRecordPayloadForSave(data)
    expect(out.rights).toEqual([{ note: 'Keep' }])
  })

  it('compacts access dates and object_display_status', () => {
    const data = {
      access: {
        category: { pref_label: { fi: 'rajoittamaton' } },
        date: { text: '  ' },
        object_display_status: {
          type: { pref_label: { fi: 'konservoitu' } },
          date: { text: '2021' },
        },
        note: '  ',
      },
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.access?.date).toBeUndefined()
    expect(out.access?.note).toBeUndefined()
    expect(out.access?.object_display_status).toEqual({
      type: { pref_label: { fi: 'konservoitu' } },
      date: { note: '2021' },
    })
    expect(referenceFieldFi(out.access?.category)).toBe('rajoittamaton')
  })

  it('removes access when compacted domain is empty', () => {
    const data = {
      access: {
        date: { text: '' },
        object_display_status: { type: undefined, date: { text: '  ' } },
      },
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.access).toBeUndefined()
  })

  it('compacts object_location date and location', () => {
    const data = {
      object_location: [
        {
          identifier: 'L1',
          date: { text: '  ' },
          location: { name: { fi: 'Vault' } },
          note: 'General',
        },
      ],
    }
    const out = compactRecordPayloadForSave(data)
    const row = out.object_location?.[0]
    expect(row?.date).toBeUndefined()
    expect(row?.location).toEqual({ name: { fi: 'Vault' } })
    expect(row?.identifier).toBe('L1')
    expect(row?.note).toBe('General')
  })

  it('compacts legacy single object object_location to list shape', () => {
    const data = {
      object_location: {
        identifier: 'Legacy',
        location: { name: { fi: 'Hall' } },
      },
    } as RecordPayload
    const out = compactRecordPayloadForSave(data)
    expect(out.object_location?.length).toBe(1)
    expect(out.object_location?.[0]?.identifier).toBe('Legacy')
  })

  it('removes object_location when compacted domain is empty', () => {
    const data = {
      object_location: [
        {
          date: { text: '' },
          location: {},
          note: '  ',
        },
      ],
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.object_location).toBeUndefined()
  })

  it('preserves empty technique placeholder rows when normalizing (Lisää tekniikka)', () => {
    const normalized = normalizeObjectProductionInformationList([{ techniques: [{}] }])
    expect(normalized[0].techniques).toEqual([{}])
  })

  it('migrates legacy object_production technique + technique_type to techniques and strips legacy keys', () => {
    const data = {
      history: {
        object_production_information: [
          {
            technique: { pref_label: { fi: 'öljymaalaus' } },
            technique_type: [{ pref_label: { fi: 'taide' } }],
          },
        ],
      },
    }
    const out = compactRecordPayloadForSave(data)
    expect(out.history?.object_production_information?.[0]).toEqual({
      techniques: [
        {
          name: { pref_label: { fi: 'öljymaalaus' } },
          type: { pref_label: { fi: 'taide' } },
        },
      ],
    })
  })
})
