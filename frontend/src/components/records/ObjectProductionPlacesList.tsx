/**
 * Valmistukseen liittyvät paikat — same pattern as description “Sisällön paikat”.
 */

import { useTranslation } from 'react-i18next'
import type { Spatial } from '../../types/record/actor'
import { spatialRowHasContent } from '../../lib/acquisitionPayload'
import { referenceFieldFi } from '../../lib/referenceField'
import { CollapsibleRepeatableRow } from './CollapsibleRepeatableRow'
import { SpatialFields } from './SpatialFields'
import { useRepeatableCollapsedRows } from './useRepeatableCollapsedRows'

export function ObjectProductionPlacesList({
  places,
  onChange,
  idPrefix,
  disabled,
}: {
  places: Spatial[]
  onChange: (next: Spatial[] | undefined) => void
  idPrefix: string
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const col = useRepeatableCollapsedRows(places, spatialRowHasContent)

  return (
    <fieldset className="record-form-repeatable-fieldset">
      <legend>{t('recordForm.history.productionPlacesLegend')}</legend>
      <p className="record-form-repeatable-hint">{t('recordForm.history.productionPlacesHint')}</p>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onChange([...places, {}])}
        disabled={disabled}
      >
        {t('recordForm.history.addProductionPlace')}
      </button>
      {places.map((row, index) => (
        <CollapsibleRepeatableRow
          key={index}
          id={`${idPrefix}-row-${index}`}
          collapsed={col.isCollapsed(index)}
          onToggleCollapse={() => col.toggle(index)}
          onRemove={() => {
            const next = places.filter((_, i) => i !== index)
            onChange(next.length ? next : undefined)
          }}
          disabled={disabled}
          saveItemNoun={t('recordForm.repeatable.saveItemLabels.productionPlace')}
          summary={
            row.name?.fi?.trim() ||
            row.name?.en?.trim() ||
            row.note?.trim() ||
            referenceFieldFi(row.name_type) ||
            referenceFieldFi(row.content_place_role) ||
            referenceFieldFi(row.status) ||
            row.environmental_details?.trim() ||
            row.position?.trim() ||
            t('recordForm.history.emptyProductionPlace')
          }
        >
          <SpatialFields
            idPrefix={`${idPrefix}-pl-${index}`}
            nameInputMode="multilingual"
            omitNameGroupLegend
            includeUndefinedLanguage={false}
            placeNameFinnishLabel={t('recordForm.history.productionPlaceNameFi')}
            placeNameEnglishLabel={t('recordForm.history.productionPlaceNameEn')}
            placeNameTypeLabel={t('recordForm.history.productionPlaceNameType')}
            placeNameTypeInfoKey="recordForm.info.history.productionPlaceNameType"
            nameTypeAfterPlaceNames
            showContentPlaceRole
            contentPlaceRoleLabel={t('recordForm.history.productionPlaceRole')}
            contentPlaceRoleInfoKey="recordForm.info.history.productionPlaceRole"
            noteAtBottom
            placeDetailsCollapsible
            value={row}
            onChange={(next) => {
              const rows = [...places]
              rows[index] = next ?? ({} as Spatial)
              onChange(rows)
            }}
            disabled={disabled}
          />
        </CollapsibleRepeatableRow>
      ))}
    </fieldset>
  )
}
