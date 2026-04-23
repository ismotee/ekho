/**
 * Catalog Actor.data editor (docs/data/actor-models.md): person XOR organization, optional org contact_person.
 */

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Actor, Address, NameDetail, OrganizationHistory, Person, PersonName } from '../../types/record/actor'
import { DateDetailInputs } from '../records/TemporalFields'
import { MultilingualLabelInputs } from '../records/MultilingualLabelInputs'
import { SpatialFields } from '../records/SpatialFields'
import { dateDetailHasPersistableContent, dateDetailSummaryLine } from '../../lib/temporalPayload'
import type { BiographicalNote } from '../../types/record/actor'
import {
  ACTOR_ADDRESS_TYPE_FI,
  ACTOR_ORGANIZATION_ADDRESS_TYPE_AUTO_FI,
  ACTOR_PERSON_ADDRESS_TYPE_AUTO_FI,
  ACTOR_ORG_IDENTIFIER_TYPE_FI,
  ACTOR_ORGANIZATION_NAME_TYPE_FI,
  ACTOR_PERSON_GENDER_FI,
  ACTOR_PERSON_NAME_TYPE_FI,
  ACTOR_PERSON_NATIONALITY_FI,
} from '../../data/actorFormAllowlists'
import {
  inferActorCatalogKind,
  organizationHasIdentity,
  organizationHistoryHasContent,
  organizationNameDetailRowHasContent,
  personHasIdentity,
  personNameRowHasIdentity,
} from '../../lib/actorCatalogPayload'
import { ORGANIZATION_HISTORY_SOURCE_TYPE_FI } from '../../data/referenceVocabularies'
import { referenceFieldFi, referenceFieldToPayload } from '../../lib/referenceField'
import { ReferenceSelect } from '../records/ReferenceSelect'
import { CollapsibleRepeatableRow } from '../records/CollapsibleRepeatableRow'
import { useRepeatableCollapsedRows } from '../records/useRepeatableCollapsedRows'
import { useTranslation } from 'react-i18next'
import '../records/Records.css'
import './Actors.css'

/** Collapsible subsection inside organization history (foundation dates, place, historiikki). */
function OrgHistoryCollapsibleBlock({
  idPrefix,
  sectionKey,
  title,
  expanded,
  onToggle,
  children,
}: {
  idPrefix: string
  sectionKey: string
  title: string
  expanded: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const toggleId = `${idPrefix}-sub-${sectionKey}-toggle`
  const panelId = `${idPrefix}-sub-${sectionKey}-panel`
  return (
    <div className="actor-form-org-sub-collapsible">
      <div className="actor-form-org-sub-collapsible-head">
        <button
          id={toggleId}
          type="button"
          className="actor-form-org-sub-collapsible-toggle"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
        >
          <span className="actor-form-org-sub-collapsible-chevron" aria-hidden>
            {expanded ? '▼' : '▶'}
          </span>
          <span>{title}</span>
        </button>
      </div>
      <div
        id={panelId}
        role="region"
        aria-labelledby={toggleId}
        hidden={!expanded}
        className="actor-form-org-sub-collapsible-panel"
      >
        {children}
      </div>
    </div>
  )
}

function AddressInputs({
  idPrefix,
  value,
  onChange,
  disabled,
  textFieldLabel,
  hideTypeField,
  autoTypeFiWhenFilled,
  fieldsetLegend,
  omitAddressTextLabel,
  omitFieldsetLegend,
}: {
  idPrefix: string
  value?: Address
  onChange: (next: Address | undefined) => void
  disabled?: boolean
  /** Label for the free-text address field; defaults to “Text”. */
  textFieldLabel?: string
  /** Hide address type selector (e.g. organization: type is derived). */
  hideTypeField?: boolean
  /** When set with `hideTypeField`, written to `type` whenever text/email/phone has content. */
  autoTypeFiWhenFilled?: string
  /** Fieldset legend; defaults to “Address”. */
  fieldsetLegend?: string
  /** When true, no visible label above the main address textarea (use fieldset legend + aria-label). */
  omitAddressTextLabel?: boolean
  /** When true, no inner legend (parent provides section title, e.g. collapsible). */
  omitFieldsetLegend?: boolean
}) {
  const { t } = useTranslation()
  const a = value ?? {}
  const patch = (p: Partial<Address>) => {
    let n = { ...a, ...p }
    if (hideTypeField && autoTypeFiWhenFilled) {
      const hasContact = !!(n.text?.trim() || n.email?.trim() || n.phone_number?.trim())
      n.type = hasContact ? autoTypeFiWhenFilled : undefined
    }
    const empty = hideTypeField && autoTypeFiWhenFilled
      ? !n.text?.trim() && !n.email?.trim() && !n.phone_number?.trim()
      : !n.text?.trim() &&
        !n.email?.trim() &&
        !n.phone_number?.trim() &&
        !(typeof n.type === 'string' && n.type.trim())
    onChange(empty ? undefined : n)
  }
  const resolvedLegend = fieldsetLegend ?? t('actors.form.fields.address')
  const mainTextAria =
    omitAddressTextLabel ? textFieldLabel ?? resolvedLegend : undefined

  return (
    <fieldset
      className="actor-form-nested-fieldset"
      aria-label={omitFieldsetLegend ? resolvedLegend : undefined}
    >
      {!omitFieldsetLegend ? <legend>{resolvedLegend}</legend> : null}
      {!hideTypeField ? (
        <ReferenceSelect
          id={`${idPrefix}-type`}
          label={t('recordForm.labels.type')}
          allowlist={ACTOR_ADDRESS_TYPE_FI}
          valueFi={typeof a.type === 'string' ? a.type : referenceFieldFi(a.type as never)}
          onChangeFi={(fi) => patch({ type: fi.trim() ? fi : undefined })}
          disabled={disabled}
          emptyLabel="—"
        />
      ) : null}
      <div className="form-group">
        {!omitAddressTextLabel ? (
          <label htmlFor={`${idPrefix}-text`}>{textFieldLabel ?? t('actors.form.fields.text')}</label>
        ) : null}
        <textarea
          id={`${idPrefix}-text`}
          value={a.text ?? ''}
          onChange={(e) => patch({ text: e.target.value || undefined })}
          rows={2}
          disabled={disabled}
          aria-label={mainTextAria}
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
  variant = 'person',
}: {
  idPrefix: string
  value?: BiographicalNote
  onChange: (next: BiographicalNote | undefined) => void
  disabled?: boolean
  /** Narrative label differs; source block matches organization (citation, type list, date, note). */
  variant?: 'person' | 'organization'
}) {
  const { t } = useTranslation()
  const b = value ?? {}
  const src = b.source ?? {}

  const commit = (nextBio: BiographicalNote) => {
    const n = { ...nextBio }
    const s = n.source
    if (s) {
      const cit = (s.citation ?? '').trim()
      const st =
        typeof s.source_type === 'string'
          ? s.source_type.trim()
          : referenceFieldFi(s.source_type as never)
      const sn = s.note?.trim()
      const sd = dateDetailHasPersistableContent(s.source_date)
      if (!cit && !st && !sn && !sd) n.source = undefined
    }
    if (!n.note?.trim() && !n.source) onChange(undefined)
    else onChange(n)
  }

  const narrativeLabel =
    variant === 'organization'
      ? t('actors.form.fields.organizationHistoryNarrative')
      : t('actors.form.fields.biographicalNote')

  const noteBlock = (
    <div className="form-group">
      <label htmlFor={`${idPrefix}-note`}>{narrativeLabel}</label>
      <textarea
        id={`${idPrefix}-note`}
        value={b.note ?? ''}
        onChange={(e) => commit({ ...b, note: e.target.value || undefined })}
        rows={4}
        disabled={disabled}
      />
    </div>
  )

  const sourceFieldsBio = (
    <>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-src-citation`}>{t('actors.form.fields.sourceCitation')}</label>
        <input
          id={`${idPrefix}-src-citation`}
          type="text"
          value={src.citation ?? ''}
          onChange={(e) =>
            commit({
              ...b,
              source: { ...src, citation: e.target.value.trim() || undefined },
            })
          }
          disabled={disabled}
        />
      </div>
      <ReferenceSelect
        id={`${idPrefix}-src-type`}
        label={t('actors.form.fields.sourceType')}
        allowlist={ORGANIZATION_HISTORY_SOURCE_TYPE_FI}
        valueFi={referenceFieldFi(src.source_type)}
        onChangeFi={(fi) =>
          commit({
            ...b,
            source: { ...src, source_type: fi.trim() || undefined },
          })
        }
        disabled={disabled}
        emptyLabel="—"
      />
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
        <label htmlFor={`${idPrefix}-src-note`}>{t('recordForm.labels.noteActorSource')}</label>
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
    </>
  )

  return (
    <div className="actor-form-org-history-bio-group actor-form-nested-fieldset">
      {noteBlock}
      <div className="actor-form-org-source-subgroup" aria-labelledby={`${idPrefix}-src-sublegend`}>
        <span id={`${idPrefix}-src-sublegend`} className="actor-form-sublegend">
          {t('actors.form.fields.organizationHistorySourceLegend')}
        </span>
        {sourceFieldsBio}
      </div>
    </div>
  )
}

function personNameRowSummary(row: PersonName, emptyLabel: string): string {
  const n = row.name?.trim()
  if (n) return n.length > 72 ? `${n.slice(0, 69)}…` : n
  const tt =
    typeof row.name_type === 'string' ? row.name_type : referenceFieldFi(row.name_type as never)
  if (tt) return tt
  const d = dateDetailSummaryLine(row.date)
  if (d) return d
  return emptyLabel
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
  const nameRowsCol = useRepeatableCollapsedRows(rows, personNameRowHasIdentity)

  return (
    <fieldset className="record-form-repeatable-fieldset">
      <legend>{legend}</legend>
      <p className="record-form-repeatable-hint">{t('actors.form.personNameRowsHint')}</p>
      {rows.map((row, i) => (
        <CollapsibleRepeatableRow
          key={i}
          id={`${idPrefix}-row-${i}`}
          collapsed={nameRowsCol.isCollapsed(i)}
          onToggleCollapse={() => nameRowsCol.toggle(i)}
          onRemove={() => onChangeRows(rows.filter((_, j) => j !== i))}
          disabled={disabled}
          saveItemNoun={t('actors.form.saveNameDetailNoun')}
          summary={personNameRowSummary(row, t('actors.form.emptyNameDetail'))}
          removeLabel={t('actors.form.removeNameDetail')}
        >
          <div className="form-group actor-form-person-name-field">
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
          <div className="form-group actor-form-in-use-checkbox">
            <label htmlFor={`${idPrefix}-inuse-${i}`} className="actor-form-in-use-label">
              <input
                id={`${idPrefix}-inuse-${i}`}
                type="checkbox"
                checked={row.in_use !== false}
                onChange={(e) =>
                  onChangeRows(
                    rows.map((x, j) =>
                      j === i ? { ...x, in_use: e.target.checked ? true : false } : x,
                    ),
                  )
                }
                disabled={disabled}
              />
              <span>{t('actors.form.fields.inUseInActorSelects')}</span>
            </label>
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
          <DateDetailInputs
            idPrefix={`${idPrefix}-d-${i}`}
            legend={t('actors.form.fields.nameDate')}
            value={row.date}
            onChange={(d) => onChangeRows(rows.map((x, j) => (j === i ? { ...x, date: d } : x)))}
            disabled={disabled}
            temporalMetadataFields
          />
        </CollapsibleRepeatableRow>
      ))}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onChangeRows([...rows, { in_use: true }])}
        disabled={disabled}
      >
        {t('actors.form.addNameDetail')}
      </button>
    </fieldset>
  )
}

function PersonCatalogFields({
  idPrefix,
  person: personProp,
  onPatch,
  disabled,
  ownerPinnedActorId,
}: {
  idPrefix: string
  person?: Person
  onPatch: (patch: Partial<Person>) => void
  disabled?: boolean
  /** When editing this person as a catalog actor, pin them in spatial “owner” select (same idea as org foundation place). */
  ownerPinnedActorId?: number
}) {
  const { t } = useTranslation()
  const person = personProp ?? {}
  const [birthDateOpen, setBirthDateOpen] = useState(false)
  const [deathDateOpen, setDeathDateOpen] = useState(false)
  const [placeOfBirthOpen, setPlaceOfBirthOpen] = useState(false)
  const [contactDetailsOpen, setContactDetailsOpen] = useState(false)
  const [professionalDetailsOpen, setProfessionalDetailsOpen] = useState(false)
  const [personBioOpen, setPersonBioOpen] = useState(false)
  return (
    <>
      <PersonNameListEditor
        idPrefix={`${idPrefix}-pfn`}
        legend={t('actors.form.fields.firstNames')}
        rows={person.first_name ?? []}
        onChangeRows={(rows) => onPatch({ first_name: rows.length ? rows : undefined })}
        disabled={disabled}
      />
      <PersonNameListEditor
        idPrefix={`${idPrefix}-pln`}
        legend={t('actors.form.fields.lastName')}
        rows={person.last_name ?? []}
        onChangeRows={(rows) => onPatch({ last_name: rows.length ? rows : undefined })}
        disabled={disabled}
      />
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
      <OrgHistoryCollapsibleBlock
        idPrefix={idPrefix}
        sectionKey="pbirth"
        title={t('actors.form.fields.birthDate')}
        expanded={birthDateOpen}
        onToggle={() => setBirthDateOpen((o) => !o)}
      >
        <DateDetailInputs
          idPrefix={`${idPrefix}-p-birth`}
          value={person.birth_date}
          onChange={(d) => onPatch({ birth_date: d })}
          disabled={disabled}
          temporalMetadataFields
        />
      </OrgHistoryCollapsibleBlock>
      <OrgHistoryCollapsibleBlock
        idPrefix={idPrefix}
        sectionKey="pdeath"
        title={t('actors.form.fields.deathDate')}
        expanded={deathDateOpen}
        onToggle={() => setDeathDateOpen((o) => !o)}
      >
        <DateDetailInputs
          idPrefix={`${idPrefix}-p-death`}
          value={person.death_date}
          onChange={(d) => onPatch({ death_date: d })}
          disabled={disabled}
          temporalMetadataFields
        />
      </OrgHistoryCollapsibleBlock>
      <OrgHistoryCollapsibleBlock
        idPrefix={idPrefix}
        sectionKey="pob"
        title={t('actors.form.fields.placeOfBirth')}
        expanded={placeOfBirthOpen}
        onToggle={() => setPlaceOfBirthOpen((o) => !o)}
      >
        <fieldset
          className="actor-form-nested-fieldset"
          aria-label={t('actors.form.fields.placeOfBirth')}
        >
          <SpatialFields
            idPrefix={`${idPrefix}-p-pob`}
            value={person.place_of_birth}
            onChange={(s) => onPatch({ place_of_birth: s })}
            disabled={disabled}
            includeUndefinedLanguage={false}
            omitNameGroupLegend
            placeNameFinnishLabel={t('actors.form.fields.placeOfBirthNameFi')}
            placeNameEnglishLabel={t('actors.form.fields.placeOfBirthNameEn')}
            ownerPinnedActorId={ownerPinnedActorId}
          />
        </fieldset>
      </OrgHistoryCollapsibleBlock>
      <OrgHistoryCollapsibleBlock
        idPrefix={idPrefix}
        sectionKey="contact"
        title={t('actors.form.fields.contactDetails')}
        expanded={contactDetailsOpen}
        onToggle={() => setContactDetailsOpen((o) => !o)}
      >
        <AddressInputs
          idPrefix={`${idPrefix}-p-addr`}
          fieldsetLegend={t('actors.form.fields.contactDetails')}
          textFieldLabel={t('actors.form.fields.homeAddress')}
          hideTypeField
          autoTypeFiWhenFilled={ACTOR_PERSON_ADDRESS_TYPE_AUTO_FI}
          value={person.address}
          onChange={(a) => onPatch({ address: a })}
          disabled={disabled}
          omitFieldsetLegend
        />
      </OrgHistoryCollapsibleBlock>
      <OrgHistoryCollapsibleBlock
        idPrefix={idPrefix}
        sectionKey="prof"
        title={t('actors.form.fields.professionalAdditionalDetails')}
        expanded={professionalDetailsOpen}
        onToggle={() => setProfessionalDetailsOpen((o) => !o)}
      >
        <fieldset
          className="actor-form-nested-fieldset"
          aria-label={t('actors.form.fields.professionalAdditionalDetails')}
        >
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
        </fieldset>
      </OrgHistoryCollapsibleBlock>
      <OrgHistoryCollapsibleBlock
        idPrefix={idPrefix}
        sectionKey="pbio"
        title={t('actors.form.fields.biographicalNote')}
        expanded={personBioOpen}
        onToggle={() => setPersonBioOpen((o) => !o)}
      >
        <BiographicalNoteInputs
          idPrefix={`${idPrefix}-p-bio`}
          value={person.biographical_note}
          onChange={(b) => onPatch({ biographical_note: b })}
          disabled={disabled}
          variant="person"
        />
      </OrgHistoryCollapsibleBlock>
    </>
  )
}

function organizationNameDetailSummary(row: NameDetail, emptyLabel: string): string {
  const n = row.name ?? {}
  const text = n.fi?.trim() || n.en?.trim() || n.und?.trim()
  if (text) return text.length > 72 ? `${text.slice(0, 69)}…` : text
  const t = referenceFieldFi(row.name_type)
  if (t) return t
  if (row.addition_to_name?.trim()) return row.addition_to_name.trim()
  const e = dateDetailSummaryLine(row.earliest)
  if (e) return e
  const l = dateDetailSummaryLine(row.latest)
  if (l) return l
  return emptyLabel
}

function NameDetailListEditor({
  idPrefix,
  rows,
  onChangeRows,
  disabled,
  includeUndefinedLanguage = true,
}: {
  idPrefix: string
  rows: NameDetail[]
  onChangeRows: (r: NameDetail[]) => void
  disabled?: boolean
  includeUndefinedLanguage?: boolean
}) {
  const { t } = useTranslation()
  const nameRowsCol = useRepeatableCollapsedRows(rows, organizationNameDetailRowHasContent)

  return (
    <fieldset className="record-form-repeatable-fieldset">
      <legend>{t('actors.form.fields.organizationNames')}</legend>
      <p className="record-form-repeatable-hint">{t('actors.form.organizationNamesHint')}</p>
      {rows.map((row, i) => (
        <CollapsibleRepeatableRow
          key={i}
          id={`${idPrefix}-row-${i}`}
          collapsed={nameRowsCol.isCollapsed(i)}
          onToggleCollapse={() => nameRowsCol.toggle(i)}
          onRemove={() => onChangeRows(rows.filter((_, j) => j !== i))}
          disabled={disabled}
          saveItemNoun={t('actors.form.saveNameDetailNoun')}
          summary={organizationNameDetailSummary(row, t('actors.form.emptyNameDetail'))}
          removeLabel={t('actors.form.removeNameDetail')}
        >
          <ReferenceSelect
            id={`${idPrefix}-tp-${i}`}
            label={t('recordForm.labels.nameType')}
            allowlist={ACTOR_ORGANIZATION_NAME_TYPE_FI}
            valueFi={referenceFieldFi(row.name_type)}
            onChangeFi={(fi) =>
              onChangeRows(
                rows.map((x, j) =>
                  j === i ? { ...x, name_type: referenceFieldToPayload(fi) } : x,
                ),
              )
            }
            disabled={disabled}
            emptyLabel="—"
          />
          <div className="form-group actor-form-in-use-checkbox">
            <label htmlFor={`${idPrefix}-inuse-${i}`} className="actor-form-in-use-label">
              <input
                id={`${idPrefix}-inuse-${i}`}
                type="checkbox"
                checked={row.in_use !== false}
                onChange={(e) =>
                  onChangeRows(
                    rows.map((x, j) =>
                      j === i ? { ...x, in_use: e.target.checked ? true : false } : x,
                    ),
                  )
                }
                disabled={disabled}
              />
              <span>{t('actors.form.fields.inUseInActorSelects')}</span>
            </label>
          </div>
          <MultilingualLabelInputs
            idPrefix={`${idPrefix}-nm-${i}`}
            finnishLabel={t('actors.form.fields.nameInFinnish')}
            englishLabel={t('actors.form.fields.nameInEnglish')}
            value={row.name}
            onChange={(l) => onChangeRows(rows.map((x, j) => (j === i ? { ...x, name: l } : x)))}
            disabled={disabled}
            includeUndefinedLanguage={includeUndefinedLanguage}
          />
          <div className="form-group">
            <label htmlFor={`${idPrefix}-addn-${i}`}>{t('actors.form.fields.additionToName')}</label>
            <p className="record-form-repeatable-hint" id={`${idPrefix}-addn-hint-${i}`}>
              {t('actors.form.organizationAdditionToNameHint')}
            </p>
            <input
              id={`${idPrefix}-addn-${i}`}
              aria-describedby={`${idPrefix}-addn-hint-${i}`}
              type="text"
              value={row.addition_to_name ?? ''}
              onChange={(e) =>
                onChangeRows(
                  rows.map((x, j) =>
                    j === i ? { ...x, addition_to_name: e.target.value || undefined } : x,
                  ),
                )
              }
              disabled={disabled}
            />
          </div>
          <DateDetailInputs
            idPrefix={`${idPrefix}-ear-${i}`}
            legend={t('recordForm.temporal.earliest')}
            value={row.earliest}
            onChange={(next) =>
              onChangeRows(rows.map((x, j) => (j === i ? { ...x, earliest: next } : x)))
            }
            disabled={disabled}
          />
          <DateDetailInputs
            idPrefix={`${idPrefix}-lat-${i}`}
            legend={t('recordForm.temporal.latest')}
            value={row.latest}
            onChange={(next) =>
              onChangeRows(rows.map((x, j) => (j === i ? { ...x, latest: next } : x)))
            }
            disabled={disabled}
          />
        </CollapsibleRepeatableRow>
      ))}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onChangeRows([...rows, { in_use: true }])}
        disabled={disabled}
      >
        {t('actors.form.addNameDetail')}
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
  /** Catalog actor id when editing — enables “this organization” on foundation place owner. */
  catalogActorId?: number
}

export function ActorDataEditor({
  value,
  onChange,
  disabled,
  idPrefix = 'actor-data',
  actorKind = null,
  onActorKindChange,
  dataVersion = 0,
  catalogActorId,
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
  const [orgHistoryExpanded, setOrgHistoryExpanded] = useState(false)
  const [orgHistFoundationDateOpen, setOrgHistFoundationDateOpen] = useState(false)
  const [orgHistDissolutionDateOpen, setOrgHistDissolutionDateOpen] = useState(false)
  const [orgHistFoundationPlaceOpen, setOrgHistFoundationPlaceOpen] = useState(false)
  const [orgHistBioOpen, setOrgHistBioOpen] = useState(false)
  const [orgContactDetailsOpen, setOrgContactDetailsOpen] = useState(false)
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
            ownerPinnedActorId={catalogActorId != null ? catalogActorId : undefined}
          />
        </fieldset>
      )}

      {effectiveKind === 'organization' && (
        <fieldset className="actor-form-main-fieldset">
          <legend>{t('actors.form.organization')}</legend>
          <NameDetailListEditor
            idPrefix={`${idPrefix}-o-nm`}
            rows={org.name ?? []}
            onChangeRows={(rows) => setOrg({ name: rows.length ? rows : undefined })}
            disabled={disabled}
            includeUndefinedLanguage={false}
          />
          <OrgHistoryCollapsibleBlock
            idPrefix={`${idPrefix}-org`}
            sectionKey="contact"
            title={t('actors.form.fields.contactDetails')}
            expanded={orgContactDetailsOpen}
            onToggle={() => setOrgContactDetailsOpen((o) => !o)}
          >
            <AddressInputs
              idPrefix={`${idPrefix}-o-addr`}
              fieldsetLegend={t('actors.form.fields.contactDetails')}
              textFieldLabel={t('actors.form.fields.visitAddress')}
              hideTypeField
              autoTypeFiWhenFilled={ACTOR_ORGANIZATION_ADDRESS_TYPE_AUTO_FI}
              value={org.address}
              onChange={(a) => setOrg({ address: a })}
              disabled={disabled}
              omitFieldsetLegend
            />
          </OrgHistoryCollapsibleBlock>
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
          <fieldset className="actor-form-nested-fieldset">
            <legend id={`${idPrefix}-o-idn-leg`} className="actor-form-sublegend">
              {t('actors.form.fields.organizationIdentification')}
            </legend>
            <div className="form-group">
              <input
                id={`${idPrefix}-o-ref-t`}
                type="text"
                aria-labelledby={`${idPrefix}-o-idn-leg`}
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
              label={t('actors.form.fields.organizationIdentificationType')}
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
          </fieldset>

          <fieldset className="actor-form-nested-fieldset actor-form-org-history-section">
            <legend className="actor-form-org-history-legend">
              <button
                id={`${idPrefix}-org-hist-toggle`}
                type="button"
                className="actor-form-org-history-toggle"
                onClick={() => setOrgHistoryExpanded((o) => !o)}
                aria-expanded={orgHistoryExpanded}
                aria-controls={`${idPrefix}-org-hist-panel`}
              >
                <span className="actor-form-org-history-chevron" aria-hidden>
                  {orgHistoryExpanded ? '▼' : '▶'}
                </span>
                <span>{t('actors.form.fields.organizationHistory')}</span>
              </button>
            </legend>
            <div
              id={`${idPrefix}-org-hist-panel`}
              role="region"
              aria-labelledby={`${idPrefix}-org-hist-toggle`}
              hidden={!orgHistoryExpanded}
              className="actor-form-org-history-panel"
            >
              <OrgHistoryCollapsibleBlock
                idPrefix={`${idPrefix}-o-h`}
                sectionKey="fd"
                title={t('actors.form.fields.foundationDate')}
                expanded={orgHistFoundationDateOpen}
                onToggle={() => setOrgHistFoundationDateOpen((o) => !o)}
              >
                <DateDetailInputs
                  idPrefix={`${idPrefix}-o-h-fd`}
                  value={history.foundation_date}
                  onChange={(d) => patchHistory({ foundation_date: d })}
                  disabled={disabled}
                />
              </OrgHistoryCollapsibleBlock>
              <OrgHistoryCollapsibleBlock
                idPrefix={`${idPrefix}-o-h`}
                sectionKey="dd"
                title={t('actors.form.fields.dissolutionDate')}
                expanded={orgHistDissolutionDateOpen}
                onToggle={() => setOrgHistDissolutionDateOpen((o) => !o)}
              >
                <DateDetailInputs
                  idPrefix={`${idPrefix}-o-h-dd`}
                  value={history.dissolution_date}
                  onChange={(d) => patchHistory({ dissolution_date: d })}
                  disabled={disabled}
                />
              </OrgHistoryCollapsibleBlock>
              <OrgHistoryCollapsibleBlock
                idPrefix={`${idPrefix}-o-h`}
                sectionKey="fp"
                title={t('actors.form.fields.foundationPlace')}
                expanded={orgHistFoundationPlaceOpen}
                onToggle={() => setOrgHistFoundationPlaceOpen((o) => !o)}
              >
                <SpatialFields
                  idPrefix={`${idPrefix}-o-h-fp`}
                  value={history.foundation_place}
                  onChange={(s) => patchHistory({ foundation_place: s })}
                  disabled={disabled}
                  includeUndefinedLanguage={false}
                  omitNameGroupLegend
                  placeNameFinnishLabel={t('actors.form.fields.foundationPlaceNameFi')}
                  placeNameEnglishLabel={t('actors.form.fields.foundationPlaceNameEn')}
                  ownerPinnedActorId={
                    effectiveKind === 'organization' && catalogActorId != null ? catalogActorId : undefined
                  }
                />
              </OrgHistoryCollapsibleBlock>
              <OrgHistoryCollapsibleBlock
                idPrefix={`${idPrefix}-o-h`}
                sectionKey="bio"
                title={t('actors.form.fields.organizationHistoryBioGroupLegend')}
                expanded={orgHistBioOpen}
                onToggle={() => setOrgHistBioOpen((o) => !o)}
              >
                <BiographicalNoteInputs
                  idPrefix={`${idPrefix}-o-h-bio`}
                  variant="organization"
                  value={history.biographical_note}
                  onChange={(b) => patchHistory({ biographical_note: b })}
                  disabled={disabled}
                />
              </OrgHistoryCollapsibleBlock>
            </div>
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
