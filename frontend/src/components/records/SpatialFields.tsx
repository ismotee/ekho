/**
 * Spatial place block (docs/data/actor-models.md — Spatial): shared by object location and actor forms.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ActorField, Spatial } from '../../types/record/actor'
import type { Coordinates, ReferenceNumber } from '../../types/record/common'
import {
  ACQUISITION_PLACE_ROLE_FI,
  COORDINATE_SYSTEM_FI,
  SPATIAL_PLACE_NAME_TYPE_FI,
  SPATIAL_PLACE_STATUS_FI,
  SPATIAL_REFERENCE_NUMBER_TYPE_FI,
} from '../../data/referenceVocabularies'
import { spatialRowHasContent } from '../../lib/acquisitionPayload'
import { actorFieldHasContent } from '../../lib/actorField'
import { referenceFieldFi, referenceFieldToPayload } from '../../lib/referenceField'
import { ActorRefSelect } from './ActorRefSelect'
import { FieldInfoText } from './FieldInfoText'
import { MultilingualLabelInputs } from './MultilingualLabelInputs'
import { ReferenceSelect } from './ReferenceSelect'

function qualifierDisplay(c?: Coordinates): string {
  const q = (c as { coordinates_qualifier?: unknown } | undefined)?.coordinates_qualifier
  if (q === undefined || q === null) return ''
  return String(q)
}

function finalizeSpatial(next: Spatial, onChange: (v: Spatial | undefined) => void) {
  onChange(spatialRowHasContent(next) ? next : undefined)
}

/** Content in fields after hankintapaikan rooli (collapsible in acquisition place rows). */
function spatialAcquisitionExtraFieldsHaveContent(s: Spatial | undefined): boolean {
  const x = s ?? {}
  if (x.note?.trim()) return true
  if (x.environmental_details?.trim() || x.position?.trim()) return true
  if (referenceFieldFi(x.status)) return true
  const rn = x.reference_number
  if (rn && typeof rn === 'object') {
    if (typeof rn.text === 'string' && rn.text.trim()) return true
    if (referenceFieldFi(rn.type)) return true
  }
  const c = x.coordinates
  if (c && typeof c === 'object') {
    if (c.text?.trim()) return true
    const cq = c.coordinates_qualifier
    if (cq !== undefined && cq !== null && String(cq).trim()) return true
    if (referenceFieldFi(c.coordinates_type)) return true
  }
  if (actorFieldHasContent(x.owner)) return true
  return false
}

export interface SpatialFieldsProps {
  idPrefix: string
  value: Spatial | undefined
  onChange: (next: Spatial | undefined) => void
  disabled?: boolean
  nameInputMode?: 'multilingual' | 'fi-only'
  includeUndefinedLanguage?: boolean
  omitNameGroupLegend?: boolean
  placeNameFinnishLabel?: string
  placeNameEnglishLabel?: string
  /** Overrides default Paikannimen tyyppi label (e.g. Sisällön paikat). */
  placeNameTypeLabel?: string
  /** Overrides default place name type guide text (e.g. Sisällön paikat). */
  placeNameTypeInfoKey?: string
  /** Foundation place / object location: pin “this organization” in owner select (catalog actor id). */
  ownerPinnedActorId?: number
  /** Acquisition place rows: hankintapaikan rooli (closed Finnish enum). */
  showAcquisitionPlaceRole?: boolean
  /** When `showAcquisitionPlaceRole`: override role label (default: acquisition place role). */
  placeRoleLabel?: string
  /** When `showAcquisitionPlaceRole`: override role guide text key. */
  placeRoleInfoKey?: string
  /** When true, render “Lisätietoja paikasta” (`note`) after all other spatial fields. */
  noteAtBottom?: boolean
  /**
   * When true (and not acquisition place UI), render Paikannimen tyyppi immediately after place name
   * fields (under multilingual EN / fi-only name), before note and other place details.
   */
  nameTypeAfterPlaceNames?: boolean
  /** Content description places: sisällön paikan rooli (same options as hankintapaikan rooli). */
  showContentPlaceRole?: boolean
  /** When `showContentPlaceRole`: override role label (default: content place role). */
  contentPlaceRoleLabel?: string
  /** When `showContentPlaceRole`: override role guide text key. */
  contentPlaceRoleInfoKey?: string
  /**
   * When true (non-acquisition UI), hide place core fields (from environmental details onward) and note
   * behind the same “Näytä paikan lisätiedot” control as acquisition place rows.
   */
  placeDetailsCollapsible?: boolean
  /** Override default `recordForm.spatialPlace.showPlaceDetails` / `hidePlaceDetails` on the toggle (e.g. object location). */
  placeDetailsToggleShowLabel?: string
  placeDetailsToggleHideLabel?: string
}

export function SpatialFields({
  idPrefix,
  value,
  onChange,
  disabled,
  nameInputMode = 'multilingual',
  includeUndefinedLanguage = true,
  omitNameGroupLegend = false,
  placeNameFinnishLabel,
  placeNameEnglishLabel,
  placeNameTypeLabel,
  placeNameTypeInfoKey,
  ownerPinnedActorId,
  showAcquisitionPlaceRole = false,
  placeRoleLabel,
  placeRoleInfoKey,
  noteAtBottom = false,
  nameTypeAfterPlaceNames = false,
  showContentPlaceRole = false,
  contentPlaceRoleLabel,
  contentPlaceRoleInfoKey,
  placeDetailsCollapsible = false,
  placeDetailsToggleShowLabel,
  placeDetailsToggleHideLabel,
}: SpatialFieldsProps) {
  const { t } = useTranslation()
  const s = value ?? {}
  const [placeExtrasOpen, setPlaceExtrasOpen] = useState(false)
  const placeExtraPanelId = `${idPrefix}-place-extra-panel`
  const hasPlaceExtraValues = spatialAcquisitionExtraFieldsHaveContent(s)

  const patchCoordinates = (patch: Partial<Coordinates>) => {
    const prev = s.coordinates ?? {}
    const c: Coordinates = {
      text: 'text' in patch ? patch.text : prev.text,
      coordinates_qualifier: 'coordinates_qualifier' in patch ? patch.coordinates_qualifier : prev.coordinates_qualifier,
      coordinates_type: 'coordinates_type' in patch ? patch.coordinates_type : prev.coordinates_type,
    }
    const qRaw = c.coordinates_qualifier
    const qStr = qRaw === undefined || qRaw === null ? '' : String(qRaw).trim()
    const empty = !c.text?.trim() && !qStr && !referenceFieldFi(c.coordinates_type)
    const next: Spatial = {
      ...s,
      coordinates: empty
        ? undefined
        : {
            text: c.text?.trim() ? c.text : undefined,
            coordinates_qualifier: qStr ? String(qRaw) : undefined,
            coordinates_type: c.coordinates_type,
          },
    }
    finalizeSpatial(next, onChange)
  }

  const patchReferenceNumber = (patch: Partial<ReferenceNumber>) => {
    const prev = s.reference_number ?? {}
    const r: ReferenceNumber = {
      text: 'text' in patch ? patch.text : prev.text,
      type: 'type' in patch ? patch.type : prev.type,
    }
    const empty = !r.text?.trim() && !referenceFieldFi(r.type)
    finalizeSpatial({ ...s, reference_number: empty ? undefined : r }, onChange)
  }

  const commit = (partial: Partial<Spatial>) => {
    const next = { ...s, ...partial }
    finalizeSpatial(next, onChange)
  }

  const noteField = (
    <div className="form-group">
      <label htmlFor={`${idPrefix}-note`}>{t('recordForm.labels.noteActorPlace')}</label>
      <textarea
        id={`${idPrefix}-note`}
        value={s.note ?? ''}
        onChange={(e) => commit({ note: e.target.value.trim() ? e.target.value : undefined })}
        rows={2}
        disabled={disabled}
      />
    </div>
  )

  const nameTypeField = (
    <ReferenceSelect
      id={`${idPrefix}-name-type`}
      label={placeNameTypeLabel ?? t('recordForm.labels.placeNameType')}
      infoKey={placeNameTypeInfoKey ?? 'recordForm.info.location.placeNameType'}
      allowlist={SPATIAL_PLACE_NAME_TYPE_FI}
      valueFi={referenceFieldFi(s.name_type)}
      onChangeFi={(fi) => commit({ name_type: fi.trim() ? referenceFieldToPayload(fi) : undefined })}
      disabled={disabled}
      emptyLabel="—"
    />
  )

  const acquisitionPlaceRoleField = (
    <ReferenceSelect
      id={`${idPrefix}-acquisition-place-role`}
      label={placeRoleLabel ?? t('recordForm.labels.acquisitionPlaceRole')}
      infoKey={placeRoleInfoKey ?? 'recordForm.info.acquisition.acquisitionPlaceRole'}
      allowlist={ACQUISITION_PLACE_ROLE_FI}
      valueFi={referenceFieldFi(s.acquisition_place_role)}
      onChangeFi={(fi) =>
        commit({ acquisition_place_role: fi.trim() ? referenceFieldToPayload(fi) : undefined })
      }
      disabled={disabled}
      emptyLabel="—"
    />
  )

  const contentPlaceRoleField = (
    <ReferenceSelect
      id={`${idPrefix}-content-place-role`}
      label={contentPlaceRoleLabel ?? t('recordForm.labels.contentPlaceRole')}
      infoKey={contentPlaceRoleInfoKey ?? 'recordForm.info.description.contentPlaceRole'}
      allowlist={ACQUISITION_PLACE_ROLE_FI}
      valueFi={referenceFieldFi(s.content_place_role)}
      onChangeFi={(fi) =>
        commit({ content_place_role: fi.trim() ? referenceFieldToPayload(fi) : undefined })
      }
      disabled={disabled}
      emptyLabel="—"
    />
  )

  const placeCoreDetailFields = (
    <>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-env`}>{t('recordForm.labels.environmentalDetails')}</label>
        <FieldInfoText infoKey="recordForm.info.location.environmentalDetails" />
        <textarea
          id={`${idPrefix}-env`}
          value={s.environmental_details ?? ''}
          onChange={(e) =>
            commit({ environmental_details: e.target.value.trim() ? e.target.value : undefined })
          }
          rows={2}
          disabled={disabled}
        />
      </div>

      <ReferenceSelect
        id={`${idPrefix}-status`}
        label={t('recordForm.labels.placeStatus')}
        infoKey="recordForm.info.location.placeStatus"
        allowlist={SPATIAL_PLACE_STATUS_FI}
        valueFi={referenceFieldFi(s.status)}
        onChangeFi={(fi) => commit({ status: fi.trim() ? fi : undefined })}
        disabled={disabled}
        emptyLabel="—"
      />

      <div className="form-group">
        <label htmlFor={`${idPrefix}-coord-text`}>{t('recordForm.labels.placeCoordinates')}</label>
        <FieldInfoText infoKey="recordForm.info.location.placeCoordinates" />
        <input
          id={`${idPrefix}-coord-text`}
          type="text"
          value={s.coordinates?.text ?? ''}
          onChange={(e) => patchCoordinates({ text: e.target.value.trim() ? e.target.value : undefined })}
          disabled={disabled}
        />
      </div>

      <div className="form-group">
        <label htmlFor={`${idPrefix}-coord-qual`}>{t('recordForm.labels.placeCoordinatesQualifier')}</label>
        <FieldInfoText infoKey="recordForm.info.location.placeCoordinatesQualifier" />
        <input
          id={`${idPrefix}-coord-qual`}
          type="text"
          value={qualifierDisplay(s.coordinates)}
          onChange={(e) =>
            patchCoordinates({
              coordinates_qualifier: e.target.value.trim() ? e.target.value : undefined,
            })
          }
          disabled={disabled}
        />
      </div>

      <ReferenceSelect
        id={`${idPrefix}-coord-sys`}
        label={t('recordForm.labels.coordinateSystem')}
        infoKey="recordForm.info.location.coordinateSystem"
        allowlist={COORDINATE_SYSTEM_FI}
        valueFi={referenceFieldFi(s.coordinates?.coordinates_type)}
        onChangeFi={(fi) => patchCoordinates({ coordinates_type: fi.trim() ? fi : undefined })}
        disabled={disabled}
        emptyLabel="—"
      />

      <div className="form-group">
        <label htmlFor={`${idPrefix}-ref-text`}>{t('recordForm.labels.placeReferenceNumber')}</label>
        <FieldInfoText infoKey="recordForm.info.location.placeReferenceNumber" />
        <input
          id={`${idPrefix}-ref-text`}
          type="text"
          value={s.reference_number?.text ?? ''}
          onChange={(e) =>
            patchReferenceNumber({ text: e.target.value.trim() ? e.target.value : undefined })
          }
          disabled={disabled}
        />
      </div>

      <ReferenceSelect
        id={`${idPrefix}-ref-type`}
        label={t('recordForm.labels.placeReferenceNumberType')}
        infoKey="recordForm.info.location.placeReferenceNumberType"
        allowlist={SPATIAL_REFERENCE_NUMBER_TYPE_FI}
        valueFi={referenceFieldFi(s.reference_number?.type)}
        onChangeFi={(fi) => patchReferenceNumber({ type: fi.trim() ? fi : undefined })}
        disabled={disabled}
        emptyLabel="—"
      />

      <div className="form-group">
        <label htmlFor={`${idPrefix}-pos`}>{t('recordForm.labels.placePosition')}</label>
        <FieldInfoText infoKey="recordForm.info.location.placePosition" />
        <input
          id={`${idPrefix}-pos`}
          type="text"
          value={s.position ?? ''}
          onChange={(e) => commit({ position: e.target.value.trim() ? e.target.value : undefined })}
          disabled={disabled}
        />
      </div>

      <ActorRefSelect
        id={`${idPrefix}-owner`}
        label={t('recordForm.labels.placeOwner')}
        value={s.owner as ActorField | undefined}
        onChange={(next) => commit({ owner: next })}
        disabled={disabled}
        pinnedActorId={ownerPinnedActorId}
        pinnedActorLabel={t('actors.form.placeOwnerThisActor')}
      />
    </>
  )

  return (
    <>
      {nameInputMode === 'fi-only' ? (
        <div className="form-group form-group--grow">
          <label htmlFor={`${idPrefix}-name-fi`}>
            {placeNameFinnishLabel ?? t('recordForm.labels.nameFinnish')}
          </label>
          <FieldInfoText infoKey="recordForm.info.location.placeName" />
          <input
            id={`${idPrefix}-name-fi`}
            type="text"
            value={s.name?.fi ?? ''}
            onChange={(e) => {
              const v = e.target.value
              finalizeSpatial({ ...s, name: v.trim() ? { fi: v } : undefined }, onChange)
            }}
            disabled={disabled}
          />
        </div>
      ) : (
        <MultilingualLabelInputs
          idPrefix={`${idPrefix}-name`}
          label={omitNameGroupLegend ? '' : t('actors.form.fields.nameLabel')}
          finnishLabel={placeNameFinnishLabel}
          englishLabel={placeNameEnglishLabel}
          value={s.name}
          onChange={(l) => commit({ name: l })}
          disabled={disabled}
          includeUndefinedLanguage={includeUndefinedLanguage}
        />
      )}

      {!showAcquisitionPlaceRole && nameTypeAfterPlaceNames ? nameTypeField : null}

      {!showAcquisitionPlaceRole && nameTypeAfterPlaceNames && showContentPlaceRole ? contentPlaceRoleField : null}

      {showAcquisitionPlaceRole ? (
        <>
          {nameTypeField}
          {acquisitionPlaceRoleField}
          <div className="record-form-date-detail-extra">
            <button
              type="button"
              className={`btn btn-secondary btn-sm record-form-date-detail-extra-toggle${
                hasPlaceExtraValues ? ' record-form-date-detail-extra-toggle--has-value' : ''
              }`}
              id={`${idPrefix}-place-extra-toggle`}
              aria-expanded={placeExtrasOpen}
              aria-controls={placeExtraPanelId}
              onClick={() => setPlaceExtrasOpen((o) => !o)}
              disabled={disabled}
            >
              {placeExtrasOpen
                ? t('recordForm.spatialPlace.hidePlaceDetails')
                : t('recordForm.spatialPlace.showPlaceDetails')}
            </button>
          </div>
          {placeExtrasOpen ? (
            <div
              className="record-form-date-detail-extra-panel"
              id={placeExtraPanelId}
              role="region"
              aria-labelledby={`${idPrefix}-place-extra-toggle`}
            >
              {!noteAtBottom ? noteField : null}
              {placeCoreDetailFields}
              {noteAtBottom ? noteField : null}
            </div>
          ) : null}
        </>
      ) : placeDetailsCollapsible ? (
        <>
          {!nameTypeAfterPlaceNames ? nameTypeField : null}
          {!nameTypeAfterPlaceNames && showContentPlaceRole ? contentPlaceRoleField : null}
          <div className="record-form-date-detail-extra">
            <button
              type="button"
              className={`btn btn-secondary btn-sm record-form-date-detail-extra-toggle${
                hasPlaceExtraValues ? ' record-form-date-detail-extra-toggle--has-value' : ''
              }`}
              id={`${idPrefix}-place-extra-toggle`}
              aria-expanded={placeExtrasOpen}
              aria-controls={placeExtraPanelId}
              onClick={() => setPlaceExtrasOpen((o) => !o)}
              disabled={disabled}
            >
              {placeExtrasOpen
                ? placeDetailsToggleHideLabel ?? t('recordForm.spatialPlace.hidePlaceDetails')
                : placeDetailsToggleShowLabel ?? t('recordForm.spatialPlace.showPlaceDetails')}
            </button>
          </div>
          {placeExtrasOpen ? (
            <div
              className="record-form-date-detail-extra-panel"
              id={placeExtraPanelId}
              role="region"
              aria-labelledby={`${idPrefix}-place-extra-toggle`}
            >
              {!noteAtBottom ? noteField : null}
              {placeCoreDetailFields}
              {noteAtBottom ? noteField : null}
            </div>
          ) : null}
        </>
      ) : (
        <>
          {!noteAtBottom ? noteField : null}
          {!nameTypeAfterPlaceNames ? nameTypeField : null}
          {placeCoreDetailFields}
          {noteAtBottom ? noteField : null}
        </>
      )}
    </>
  )
}
