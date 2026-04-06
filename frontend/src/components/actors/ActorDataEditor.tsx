/**
 * Catalog Actor.data editor (docs/data/actor-models.md): person XOR organization, optional org contact_person.
 */

import { useEffect, useState } from 'react'
import type { Actor, Address, OrganizationHistory, OtherName, Person, PersonName } from '../../types/record/actor'
import type { Label } from '../../types/record/common'
import { DateDetailInputs, TemporalFields } from '../records/TemporalFields'
import { dateDetailHasPersistableContent } from '../../lib/temporalPayload'
import type { BiographicalNote } from '../../types/record/actor'
import {
  ACTOR_ADDRESS_TYPE_FI,
  ACTOR_ORG_IDENTIFIER_TYPE_FI,
  ACTOR_ORGANIZATION_OTHER_NAME_TYPE_FI,
  ACTOR_PERSON_GENDER_FI,
  ACTOR_PERSON_NAME_TYPE_FI,
  ACTOR_PERSON_NATIONALITY_FI,
} from '../../data/actorFormAllowlists'
import {
  inferActorCatalogKind,
  organizationHasIdentity,
  organizationHistoryHasContent,
  organizationOtherNameRowHasContent,
  personHasIdentity,
  personNameRowHasIdentity,
} from '../../lib/actorCatalogPayload'
import { ReferenceSelect } from '../records/ReferenceSelect'
import { CollapsibleRepeatableRow } from '../records/CollapsibleRepeatableRow'
import { useRepeatableCollapsedRows } from '../records/useRepeatableCollapsedRows'
import { referenceFieldFi, referenceFieldToPayload } from '../../lib/referenceField'
import { useTranslation } from 'react-i18next'
import '../records/Records.css'
import './Actors.css'

function LabelInputs({
  idPrefix,
  label,
  value,
  onChange,
  disabled,
  includeUndefinedLanguage = true,
}: {
  idPrefix: string
  label: string
  value?: Label
  onChange: (next: Label | undefined) => void
  disabled?: boolean
  /** When false, only Finnish + English (organization section). */
  includeUndefinedLanguage?: boolean
}) {
  const { t } = useTranslation()
  const v = value ?? {}
  const set = (patch: Partial<Label>) => {
    let n: Label = { ...v, ...patch }
    if (!includeUndefinedLanguage) {
      const { und: _drop, ...rest } = n
      n = rest
    }
    const empty =
      !n.fi?.trim() &&
      !n.en?.trim() &&
      (includeUndefinedLanguage ? !n.und?.trim() : true)
    onChange(empty ? undefined : n)
  }
  return (
    <div className="actor-form-label-group">
      <span className="actor-form-sublegend">{label}</span>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-fi`}>{t('actors.form.fields.finnish')}</label>
        <input
          id={`${idPrefix}-fi`}
          type="text"
          value={v.fi ?? ''}
          onChange={(e) => set({ fi: e.target.value || undefined })}
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-en`}>{t('actors.form.fields.english')}</label>
        <input
          id={`${idPrefix}-en`}
          type="text"
          value={v.en ?? ''}
          onChange={(e) => set({ en: e.target.value || undefined })}
          disabled={disabled}
        />
      </div>
      {includeUndefinedLanguage ? (
        <div className="form-group">
          <label htmlFor={`${idPrefix}-und`}>{t('actors.form.fields.undefinedLanguage')}</label>
          <input
            id={`${idPrefix}-und`}
            type="text"
            value={v.und ?? ''}
            onChange={(e) => set({ und: e.target.value || undefined })}
            disabled={disabled}
          />
        </div>
      ) : null}
    </div>
  )
}

function SpatialMiniInputs({
  idPrefix,
  legend,
  value,
  onChange,
  disabled,
  includeUndefinedLanguage = true,
}: {
  idPrefix: string
  legend: string
  value?: import('../../types/record/actor').Spatial
  onChange: (next: import('../../types/record/actor').Spatial | undefined) => void
  disabled?: boolean
  includeUndefinedLanguage?: boolean
}) {
  const { t } = useTranslation()
  const s = value ?? {}
  const patch = (partial: Partial<import('../../types/record/actor').Spatial>) => {
    const n = { ...s, ...partial }
    const name = n.name ?? {}
    const empty =
      !name.fi?.trim() &&
      !name.en?.trim() &&
      !name.und?.trim() &&
      !n.note?.trim() &&
      !n.association &&
      !n.environmental_details?.trim() &&
      !n.position?.trim()
    onChange(empty ? undefined : n)
  }
  return (
    <fieldset className="actor-form-nested-fieldset">
      <legend>{legend}</legend>
      <LabelInputs
        idPrefix={`${idPrefix}-name`}
        label={t('actors.form.fields.nameLabel')}
        value={s.name}
        onChange={(l) => patch({ name: l })}
        disabled={disabled}
        includeUndefinedLanguage={includeUndefinedLanguage}
      />
      <div className="form-group">
        <label htmlFor={`${idPrefix}-note`}>{t('recordForm.labels.note')}</label>
        <textarea
          id={`${idPrefix}-note`}
          value={s.note ?? ''}
          onChange={(e) => patch({ note: e.target.value || undefined })}
          rows={2}
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-assoc`}>{t('actors.form.fields.associationRefText')}</label>
        <input
          id={`${idPrefix}-assoc`}
          type="text"
          value={typeof s.association === 'string' ? s.association : ''}
          onChange={(e) => patch({ association: e.target.value || undefined })}
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-pos`}>{t('recordForm.labels.position')}</label>
        <input
          id={`${idPrefix}-pos`}
          type="text"
          value={s.position ?? ''}
          onChange={(e) => patch({ position: e.target.value || undefined })}
          disabled={disabled}
        />
      </div>
    </fieldset>
  )
}

function AddressInputs({
  idPrefix,
  value,
  onChange,
  disabled,
}: {
  idPrefix: string
  value?: Address
  onChange: (next: Address | undefined) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const a = value ?? {}
  const patch = (p: Partial<Address>) => {
    const n = { ...a, ...p }
    const empty =
      !n.text?.trim() &&
      !n.email?.trim() &&
      !n.phone_number?.trim() &&
      !(typeof n.type === 'string' && n.type.trim())
    onChange(empty ? undefined : n)
  }
  return (
    <fieldset className="actor-form-nested-fieldset">
      <legend>{t('actors.form.fields.address')}</legend>
      <ReferenceSelect
        id={`${idPrefix}-type`}
        label={t('recordForm.labels.type')}
        allowlist={ACTOR_ADDRESS_TYPE_FI}
        valueFi={typeof a.type === 'string' ? a.type : referenceFieldFi(a.type as never)}
        onChangeFi={(fi) => patch({ type: fi.trim() ? fi : undefined })}
        disabled={disabled}
        emptyLabel="—"
      />
      <div className="form-group">
        <label htmlFor={`${idPrefix}-text`}>{t('actors.form.fields.text')}</label>
        <textarea
          id={`${idPrefix}-text`}
          value={a.text ?? ''}
          onChange={(e) => patch({ text: e.target.value || undefined })}
          rows={2}
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-email`}>{t('actors.form.fields.email')}</label>
        <input
          id={`${idPrefix}-email`}
          type="email"
          value={a.email ?? ''}
          onChange={(e) => patch({ email: e.target.value || undefined })}
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-phone`}>{t('actors.form.fields.phone')}</label>
        <input
          id={`${idPrefix}-phone`}
          type="text"
          value={a.phone_number ?? ''}
          onChange={(e) => patch({ phone_number: e.target.value || undefined })}
          disabled={disabled}
        />
      </div>
    </fieldset>
  )
}

function BiographicalNoteInputs({
  idPrefix,
  value,
  onChange,
  disabled,
}: {
  idPrefix: string
  value?: BiographicalNote
  onChange: (next: BiographicalNote | undefined) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const b = value ?? {}
  const src = b.source ?? {}

  const commit = (nextBio: BiographicalNote) => {
    const n = { ...nextBio }
    const s = n.source
    if (s) {
      const st = typeof s.source_type === 'string' ? s.source_type.trim() : ''
      const sn = s.note?.trim()
      const sd = dateDetailHasPersistableContent(s.source_date)
      if (!st && !sn && !sd) n.source = undefined
    }
    if (!n.note?.trim() && !n.source) onChange(undefined)
    else onChange(n)
  }

  return (
    <fieldset className="actor-form-nested-fieldset">
      <legend>{t('actors.form.fields.biographicalNote')}</legend>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-note`}>{t('recordForm.labels.note')}</label>
        <textarea
          id={`${idPrefix}-note`}
          value={b.note ?? ''}
          onChange={(e) => commit({ ...b, note: e.target.value || undefined })}
          rows={3}
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-src-type`}>{t('actors.form.fields.sourceType')}</label>
        <input
          id={`${idPrefix}-src-type`}
          type="text"
          value={typeof src.source_type === 'string' ? src.source_type : ''}
          onChange={(e) =>
            commit({
              ...b,
              source: { ...src, source_type: e.target.value.trim() || undefined },
            })
          }
          disabled={disabled}
        />
      </div>
      <DateDetailInputs
        idPrefix={`${idPrefix}-src-date`}
        legend={t('actors.form.fields.sourceDate')}
        value={src.source_date}
        onChange={(next) =>
          commit({
            ...b,
            source: { ...src, source_date: next },
          })
        }
        disabled={disabled}
      />
      <div className="form-group">
        <label htmlFor={`${idPrefix}-src-note`}>{t('recordForm.labels.sourceNote')}</label>
        <input
          id={`${idPrefix}-src-note`}
          type="text"
          value={src.note ?? ''}
          onChange={(e) =>
            commit({
              ...b,
              source: { ...src, note: e.target.value || undefined },
            })
          }
          disabled={disabled}
        />
      </div>
    </fieldset>
  )
}

function PersonNameListEditor({
  idPrefix,
  legend,
  rows,
  onChangeRows,
  disabled,
}: {
  idPrefix: string
  legend: string
  rows: PersonName[]
  onChangeRows: (r: PersonName[]) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  return (
    <fieldset className="actor-form-nested-fieldset">
      <legend>{legend}</legend>
      {rows.map((row, i) => (
        <div key={i} className="actor-form-repeatable-inline">
          <div className="form-group">
            <label htmlFor={`${idPrefix}-n-${i}`}>{t('recordForm.labels.name')}</label>
            <input
              id={`${idPrefix}-n-${i}`}
              type="text"
              value={row.name ?? ''}
              onChange={(e) => {
                const v = e.target.value
                onChangeRows(rows.map((x, j) => (j === i ? { ...x, name: v || undefined } : x)))
              }}
              disabled={disabled}
            />
          </div>
          <ReferenceSelect
            id={`${idPrefix}-t-${i}`}
            label={t('actors.form.fields.nameType')}
            allowlist={ACTOR_PERSON_NAME_TYPE_FI}
            valueFi={typeof row.name_type === 'string' ? row.name_type : referenceFieldFi(row.name_type as never)}
            onChangeFi={(fi) =>
              onChangeRows(rows.map((x, j) => (j === i ? { ...x, name_type: fi.trim() ? fi : undefined } : x)))
            }
            disabled={disabled}
            emptyLabel="—"
          />
          <TemporalFields
            idPrefix={`${idPrefix}-d-${i}`}
            legend={t('actors.form.fields.nameDate')}
            value={row.date}
            onChange={(d) => onChangeRows(rows.map((x, j) => (j === i ? { ...x, date: d } : x)))}
            disabled={disabled}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onChangeRows(rows.filter((_, j) => j !== i))}
            disabled={disabled}
          >
            {t('recordForm.labels.remove')}
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onChangeRows([...rows, {}])}
        disabled={disabled}
      >
        {t('actors.form.addRow')}
      </button>
    </fieldset>
  )
}

function PersonCatalogFields({
  idPrefix,
  person: personProp,
  onPatch,
  disabled,
}: {
  idPrefix: string
  person?: Person
  onPatch: (patch: Partial<Person>) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const person = personProp ?? {}
  return (
    <>
      <PersonNameListEditor
        idPrefix={`${idPrefix}-pfn`}
        legend={t('actors.form.fields.firstNames')}
        rows={person.first_name ?? []}
        onChangeRows={(rows) => onPatch({ first_name: rows.length ? rows : undefined })}
        disabled={disabled}
      />
      <fieldset className="actor-form-nested-fieldset">
        <legend>{t('actors.form.fields.lastName')}</legend>
        <div className="form-group">
          <label htmlFor={`${idPrefix}-pln-name`}>{t('recordForm.labels.name')}</label>
          <input
            id={`${idPrefix}-pln-name`}
            type="text"
            value={person.last_name?.name ?? ''}
            onChange={(e) => {
              const v = e.target.value.trim()
              const cur = person.last_name ?? {}
              const next: PersonName = { ...cur, name: v || undefined }
              onPatch({ last_name: personNameRowHasIdentity(next) ? next : undefined })
            }}
            disabled={disabled}
          />
        </div>
        <ReferenceSelect
          id={`${idPrefix}-pln-nt`}
          label={t('actors.form.fields.nameType')}
          allowlist={ACTOR_PERSON_NAME_TYPE_FI}
          valueFi={
            typeof person.last_name?.name_type === 'string'
              ? person.last_name.name_type
              : referenceFieldFi(person.last_name?.name_type as never)
          }
          onChangeFi={(fi) => {
            const cur = person.last_name ?? {}
            const next: PersonName = { ...cur, name_type: fi.trim() ? fi : undefined }
            onPatch({ last_name: personNameRowHasIdentity(next) ? next : undefined })
          }}
          disabled={disabled}
          emptyLabel="—"
        />
        <TemporalFields
          idPrefix={`${idPrefix}-pln-d`}
          legend={t('actors.form.fields.lastNameDate')}
          value={person.last_name?.date}
          onChange={(temp) => {
            const cur = person.last_name ?? {}
            const next: PersonName = { ...cur, date: temp }
            onPatch({ last_name: personNameRowHasIdentity(next) ? next : undefined })
          }}
          disabled={disabled}
        />
      </fieldset>
      <PersonNameListEditor
        idPrefix={`${idPrefix}-pon`}
        legend={t('actors.form.fields.otherNames')}
        rows={person.other_name ?? []}
        onChangeRows={(rows) => onPatch({ other_name: rows.length ? rows : undefined })}
        disabled={disabled}
      />
      <div className="form-group">
        <label htmlFor={`${idPrefix}-p-add`}>{t('actors.form.fields.additionsToName')}</label>
        <input
          id={`${idPrefix}-p-add`}
          type="text"
          value={person.additions_to_name ?? ''}
          onChange={(e) => onPatch({ additions_to_name: e.target.value || undefined })}
          disabled={disabled}
        />
      </div>
      <TemporalFields
        idPrefix={`${idPrefix}-p-birth`}
        legend={t('actors.form.fields.birthDate')}
        value={person.birth_date}
        onChange={(temp) => onPatch({ birth_date: temp })}
        disabled={disabled}
      />
      <TemporalFields
        idPrefix={`${idPrefix}-p-death`}
        legend={t('actors.form.fields.deathDate')}
        value={person.death_date}
        onChange={(temp) => onPatch({ death_date: temp })}
        disabled={disabled}
      />
      <SpatialMiniInputs
        idPrefix={`${idPrefix}-p-pob`}
        legend={t('actors.form.fields.placeOfBirth')}
        value={person.place_of_birth}
        onChange={(s) => onPatch({ place_of_birth: s })}
        disabled={disabled}
      />
      <ReferenceSelect
        id={`${idPrefix}-p-gender`}
        label={t('actors.form.fields.gender')}
        allowlist={ACTOR_PERSON_GENDER_FI}
        valueFi={typeof person.gender === 'string' ? person.gender : referenceFieldFi(person.gender as never)}
        onChangeFi={(fi) => onPatch({ gender: fi.trim() ? fi : undefined })}
        disabled={disabled}
        emptyLabel="—"
      />
      <ReferenceSelect
        id={`${idPrefix}-p-nat`}
        label={t('actors.form.fields.nationality')}
        allowlist={ACTOR_PERSON_NATIONALITY_FI}
        valueFi={
          typeof person.nationality === 'string' ? person.nationality : referenceFieldFi(person.nationality as never)
        }
        onChangeFi={(fi) => onPatch({ nationality: fi.trim() ? fi : undefined })}
        disabled={disabled}
        emptyLabel="—"
      />
      <AddressInputs
        idPrefix={`${idPrefix}-p-addr`}
        value={person.address}
        onChange={(a) => onPatch({ address: a })}
        disabled={disabled}
      />
      <div className="form-group">
        <label htmlFor={`${idPrefix}-p-web`}>{t('actors.form.fields.website')}</label>
        <input
          id={`${idPrefix}-p-web`}
          type="url"
          value={person.website ?? ''}
          onChange={(e) => onPatch({ website: e.target.value || undefined })}
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-p-school`}>{t('actors.form.fields.schoolOrStyleRefText')}</label>
        <input
          id={`${idPrefix}-p-school`}
          type="text"
          value={
            typeof person.school_or_style === 'string'
              ? person.school_or_style
              : referenceFieldFi(person.school_or_style as never)
          }
          onChange={(e) => onPatch({ school_or_style: e.target.value.trim() || undefined })}
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-p-occ`}>{t('actors.form.fields.occupationRefText')}</label>
        <input
          id={`${idPrefix}-p-occ`}
          type="text"
          value={
            typeof person.occupation === 'string' ? person.occupation : referenceFieldFi(person.occupation as never)
          }
          onChange={(e) => onPatch({ occupation: e.target.value.trim() || undefined })}
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-p-ref-t`}>{t('actors.form.fields.referenceNumberText')}</label>
        <input
          id={`${idPrefix}-p-ref-t`}
          type="text"
          value={person.reference_number?.text ?? ''}
          onChange={(e) =>
            onPatch({
              reference_number: e.target.value.trim()
                ? { ...person.reference_number, text: e.target.value.trim() }
                : undefined,
            })
          }
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-p-ref-ty`}>{t('actors.form.fields.referenceNumberType')}</label>
        <input
          id={`${idPrefix}-p-ref-ty`}
          type="text"
          value={person.reference_number?.type ?? ''}
          onChange={(e) =>
            onPatch({
              reference_number:
                e.target.value.trim() || person.reference_number?.text
                  ? {
                      text: person.reference_number?.text,
                      type: e.target.value.trim() || undefined,
                    }
                  : undefined,
            })
          }
          disabled={disabled}
        />
      </div>
      <BiographicalNoteInputs
        idPrefix={`${idPrefix}-p-bio`}
        value={person.biographical_note}
        onChange={(b) => onPatch({ biographical_note: b })}
        disabled={disabled}
      />
    </>
  )
}

function organizationOtherNameSummary(row: OtherName, emptyLabel: string): string {
  const n = row.name ?? {}
  const text = n.fi?.trim() || n.en?.trim() || n.und?.trim()
  if (text) return text.length > 72 ? `${text.slice(0, 69)}…` : text
  const t = referenceFieldFi(row.type)
  if (t) return t
  return emptyLabel
}

function OtherNameListEditor({
  idPrefix,
  rows,
  onChangeRows,
  disabled,
  includeUndefinedLanguage = true,
}: {
  idPrefix: string
  rows: OtherName[]
  onChangeRows: (r: OtherName[]) => void
  disabled?: boolean
  includeUndefinedLanguage?: boolean
}) {
  const { t } = useTranslation()
  const otherNamesCol = useRepeatableCollapsedRows(rows, organizationOtherNameRowHasContent)

  return (
    <fieldset className="record-form-repeatable-fieldset">
      <legend>{t('actors.form.fields.otherNames')}</legend>
      <p className="record-form-repeatable-hint">{t('actors.form.otherNamesHint')}</p>
      {rows.map((row, i) => (
        <CollapsibleRepeatableRow
          key={i}
          id={`${idPrefix}-row-${i}`}
          collapsed={otherNamesCol.isCollapsed(i)}
          onToggleCollapse={() => otherNamesCol.toggle(i)}
          onRemove={() => onChangeRows(rows.filter((_, j) => j !== i))}
          disabled={disabled}
          summary={organizationOtherNameSummary(row, t('actors.form.emptyOtherName'))}
          removeLabel={t('actors.form.removeOtherName')}
        >
          <LabelInputs
            idPrefix={`${idPrefix}-nm-${i}`}
            label={t('recordForm.labels.name')}
            value={row.name}
            onChange={(l) => onChangeRows(rows.map((x, j) => (j === i ? { ...x, name: l } : x)))}
            disabled={disabled}
            includeUndefinedLanguage={includeUndefinedLanguage}
          />
          <ReferenceSelect
            id={`${idPrefix}-tp-${i}`}
            label={t('recordForm.labels.type')}
            allowlist={ACTOR_ORGANIZATION_OTHER_NAME_TYPE_FI}
            valueFi={referenceFieldFi(row.type)}
            onChangeFi={(fi) =>
              onChangeRows(rows.map((x, j) => (j === i ? { ...x, type: referenceFieldToPayload(fi) } : x)))
            }
            disabled={disabled}
            emptyLabel="—"
          />
        </CollapsibleRepeatableRow>
      ))}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onChangeRows([...rows, {}])}
        disabled={disabled}
      >
        {t('actors.form.addOtherName')}
      </button>
    </fieldset>
  )
}

export type ActorCatalogKind = 'person' | 'organization' | null

export interface ActorDataEditorProps {
  value: Actor
  onChange: (next: Actor) => void
  disabled?: boolean
  idPrefix?: string
  actorKind?: ActorCatalogKind
  onActorKindChange?: (kind: ActorCatalogKind) => void
  /** Increment when loaded actor replaces form state (e.g. edit fetch) to sync optional sections. */
  dataVersion?: number
}

export function ActorDataEditor({
  value,
  onChange,
  disabled,
  idPrefix = 'actor-data',
  actorKind = null,
  onActorKindChange,
  dataVersion = 0,
}: ActorDataEditorProps) {
  const { t } = useTranslation()
  const org = value.organization ?? {}
  const person = value.person ?? {}

  const setPerson = (p: Partial<typeof person>) =>
    onChange({ ...value, person: { ...person, ...p } })
  const setOrg = (o: Partial<typeof org>) => onChange({ ...value, organization: { ...org, ...o } })

  const effectiveKind = disabled ? inferActorCatalogKind(value) : actorKind
  const ambiguousData =
    !disabled && personHasIdentity(value.person) && organizationHasIdentity(value.organization)

  const [includeContact, setIncludeContact] = useState(false)
  useEffect(() => {
    setIncludeContact(personHasIdentity(value.organization?.contact_person))
  }, [dataVersion])

  const patchContact = (patch: Partial<Person>) => {
    const c = org.contact_person ?? {}
    setOrg({ contact_person: { ...c, ...patch } })
  }

  const history = org.history ?? {}
  const patchHistory = (patch: Partial<OrganizationHistory>) => {
    const next = { ...history, ...patch }
    setOrg({ history: organizationHistoryHasContent(next) ? next : undefined })
  }

  const showContactPersonFields =
    effectiveKind === 'organization' &&
    (disabled ? personHasIdentity(org.contact_person) : includeContact)

  return (
    <div className="actor-data-editor">
      <p className="record-form-repeatable-hint">{t('actors.form.introKind')}</p>

      {ambiguousData && (
        <p className="actor-form-ambiguous-hint" role="status">
          {t('actors.form.ambiguousPersonAndOrganization')}
        </p>
      )}

      {!disabled && onActorKindChange && (
        <fieldset className="actor-form-kind-fieldset">
          <legend className="sr-only">{t('actors.form.actorTypeLegend')}</legend>
          <div className="actor-form-kind-radios" role="radiogroup" aria-label={t('actors.form.actorTypeLegend')}>
            <label className="actor-form-kind-radio">
              <input
                type="radio"
                name={`${idPrefix}-actor-kind`}
                checked={actorKind === 'person'}
                onChange={() => onActorKindChange('person')}
              />
              <span>{t('actors.form.person')}</span>
            </label>
            <label className="actor-form-kind-radio">
              <input
                type="radio"
                name={`${idPrefix}-actor-kind`}
                checked={actorKind === 'organization'}
                onChange={() => onActorKindChange('organization')}
              />
              <span>{t('actors.form.organization')}</span>
            </label>
          </div>
        </fieldset>
      )}

      {effectiveKind === 'person' && (
        <fieldset className="actor-form-main-fieldset">
          <legend>{t('actors.form.person')}</legend>
          <PersonCatalogFields
            idPrefix={`${idPrefix}-person`}
            person={person}
            onPatch={(patch) => setPerson(patch)}
            disabled={disabled}
          />
        </fieldset>
      )}

      {effectiveKind === 'organization' && (
        <fieldset className="actor-form-main-fieldset">
          <legend>{t('actors.form.organization')}</legend>
          <LabelInputs
            idPrefix={`${idPrefix}-o-main`}
            label={t('actors.form.fields.mainBody')}
            value={org.main_body}
            onChange={(l) => setOrg({ main_body: l })}
            disabled={disabled}
            includeUndefinedLanguage={false}
          />
          <LabelInputs
            idPrefix={`${idPrefix}-o-sub`}
            label={t('actors.form.fields.subBody')}
            value={org.sub_body}
            onChange={(l) => setOrg({ sub_body: l })}
            disabled={disabled}
            includeUndefinedLanguage={false}
          />
          <OtherNameListEditor
            idPrefix={`${idPrefix}-o-on`}
            rows={org.other_name ?? []}
            onChangeRows={(rows) => setOrg({ other_name: rows.length ? rows : undefined })}
            disabled={disabled}
            includeUndefinedLanguage={false}
          />
          <div className="form-group">
            <label htmlFor={`${idPrefix}-o-addn`}>{t('actors.form.fields.additionToName')}</label>
            <input
              id={`${idPrefix}-o-addn`}
              type="text"
              value={org.addition_to_name ?? ''}
              onChange={(e) => setOrg({ addition_to_name: e.target.value || undefined })}
              disabled={disabled}
            />
          </div>
          <TemporalFields
            idPrefix={`${idPrefix}-o-nd`}
            legend={t('actors.form.fields.nameDate')}
            value={org.name_date}
            onChange={(temp) => setOrg({ name_date: temp })}
            disabled={disabled}
          />
          <div className="form-group">
            <label htmlFor={`${idPrefix}-o-fn`}>{t('actors.form.fields.functionRefText')}</label>
            <input
              id={`${idPrefix}-o-fn`}
              type="text"
              value={typeof org.function === 'string' ? org.function : referenceFieldFi(org.function as never)}
              onChange={(e) => setOrg({ function: e.target.value.trim() || undefined })}
              disabled={disabled}
            />
          </div>
          <AddressInputs
            idPrefix={`${idPrefix}-o-addr`}
            value={org.address}
            onChange={(a) => setOrg({ address: a })}
            disabled={disabled}
          />
          <div className="form-group">
            <label htmlFor={`${idPrefix}-o-web`}>{t('actors.form.fields.website')}</label>
            <input
              id={`${idPrefix}-o-web`}
              type="url"
              value={org.website ?? ''}
              onChange={(e) => setOrg({ website: e.target.value || undefined })}
              disabled={disabled}
            />
          </div>
          <div className="form-group">
            <label htmlFor={`${idPrefix}-o-ref-t`}>{t('actors.form.fields.referenceIdentifierText')}</label>
            <input
              id={`${idPrefix}-o-ref-t`}
              type="text"
              value={
                org.reference_number && typeof org.reference_number === 'object' && 'text' in org.reference_number
                  ? (org.reference_number as { text?: string }).text ?? ''
                  : ''
              }
              onChange={(e) => {
                const text = e.target.value.trim()
                const cur = org.reference_number
                const typ =
                  cur && typeof cur === 'object' && 'type' in cur
                    ? (cur as { type?: string }).type
                    : undefined
                if (!text && !typ) setOrg({ reference_number: undefined })
                else setOrg({ reference_number: { text: text || undefined, type: typ } })
              }}
              disabled={disabled}
            />
          </div>
          <ReferenceSelect
            id={`${idPrefix}-o-ref-ty`}
            label={t('actors.form.fields.identifierType')}
            allowlist={ACTOR_ORG_IDENTIFIER_TYPE_FI}
            valueFi={
              org.reference_number && typeof org.reference_number === 'object' && 'type' in org.reference_number
                ? String((org.reference_number as { type?: string }).type ?? '')
                : ''
            }
            onChangeFi={(fi) => {
              const text =
                org.reference_number && typeof org.reference_number === 'object' && 'text' in org.reference_number
                  ? (org.reference_number as { text?: string }).text
                  : undefined
              if (!fi.trim() && !text?.trim()) setOrg({ reference_number: undefined })
              else setOrg({ reference_number: { text, type: fi.trim() || undefined } })
            }}
            disabled={disabled}
            emptyLabel="—"
          />

          <fieldset className="actor-form-nested-fieldset">
            <legend>{t('actors.form.fields.organizationHistory')}</legend>
            <TemporalFields
              idPrefix={`${idPrefix}-o-h-fd`}
              legend={t('actors.form.fields.foundationDate')}
              value={history.foundation_date}
              onChange={(temp) => patchHistory({ foundation_date: temp })}
              disabled={disabled}
            />
            <TemporalFields
              idPrefix={`${idPrefix}-o-h-dd`}
              legend={t('actors.form.fields.dissolutionDate')}
              value={history.dissolution_date}
              onChange={(temp) => patchHistory({ dissolution_date: temp })}
              disabled={disabled}
            />
            <SpatialMiniInputs
              idPrefix={`${idPrefix}-o-h-fp`}
              legend={t('actors.form.fields.foundationPlace')}
              value={history.foundation_place}
              onChange={(s) => patchHistory({ foundation_place: s })}
              disabled={disabled}
              includeUndefinedLanguage={false}
            />
            <BiographicalNoteInputs
              idPrefix={`${idPrefix}-o-h-bio`}
              value={history.biographical_note}
              onChange={(b) => patchHistory({ biographical_note: b })}
              disabled={disabled}
            />
          </fieldset>

          {!disabled && (
            <div className="actor-form-section-toggle form-group">
              <label className="actor-form-enable-label" htmlFor={`${idPrefix}-include-contact`}>
                <input
                  id={`${idPrefix}-include-contact`}
                  type="checkbox"
                  checked={includeContact}
                  onChange={(e) => {
                    const on = e.target.checked
                    setIncludeContact(on)
                    if (!on) setOrg({ contact_person: undefined })
                  }}
                  disabled={disabled}
                />
                <span>{t('actors.form.includeContactPerson')}</span>
              </label>
            </div>
          )}

          {showContactPersonFields && (
            <fieldset className="actor-form-nested-fieldset">
              <legend>{t('actors.form.contactPerson')}</legend>
              <PersonCatalogFields
                idPrefix={`${idPrefix}-contact`}
                person={org.contact_person}
                onPatch={patchContact}
                disabled={disabled}
              />
            </fieldset>
          )}
        </fieldset>
      )}
    </div>
  )
}
