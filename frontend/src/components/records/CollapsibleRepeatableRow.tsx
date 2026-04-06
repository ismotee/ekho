import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export interface CollapsibleRepeatableRowProps {
  id: string
  summary: ReactNode
  collapsed: boolean
  onToggleCollapse: () => void
  onRemove: () => void
  disabled?: boolean
  children: ReactNode
  removeLabel?: string
  /** Short noun for the save action, e.g. translated "title" → "Tallenna nimeke" */
  saveItemNoun?: string
}

export function CollapsibleRepeatableRow({
  id,
  summary,
  collapsed,
  onToggleCollapse,
  onRemove,
  disabled,
  children,
  removeLabel,
  saveItemNoun,
}: CollapsibleRepeatableRowProps) {
  const { t } = useTranslation()
  const resolvedRemove = removeLabel ?? t('recordForm.repeatable.remove')
  const item = saveItemNoun?.trim()
  const saveLabel = item
    ? t('recordForm.repeatable.saveItem', { item })
    : t('recordForm.repeatable.save')
  const panelId = `${id}-panel`
  const headingId = `${id}-heading`

  return (
    <div
      className={`record-form-repeatable-row record-form-repeatable-row--collapsible${
        collapsed ? ' record-form-repeatable-row--collapsed' : ''
      }`}
    >
      <div className="record-form-repeatable-row-toolbar" role="group" aria-label={t('recordForm.repeatable.entryActionsAria')}>
        <button
          type="button"
          className={`btn btn-sm record-form-repeatable-row-toggle ${
            collapsed ? 'record-form-repeatable-edit' : 'btn-primary'
          }`}
          onClick={onToggleCollapse}
          disabled={disabled}
          aria-expanded={!collapsed}
          aria-controls={panelId}
          id={headingId}
        >
          {collapsed ? t('recordForm.repeatable.edit') : saveLabel}
        </button>
        {collapsed && (
          <div className="record-form-repeatable-summary" aria-live="polite">
            {summary}
          </div>
        )}
        <div className="record-form-repeatable-row-toolbar-actions">
          <button
            type="button"
            className="btn btn-sm record-form-repeatable-remove"
            onClick={onRemove}
            disabled={disabled}
          >
            {resolvedRemove}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div
          className="record-form-repeatable-panel"
          id={panelId}
          role="region"
          aria-labelledby={headingId}
        >
          {children}
        </div>
      )}
    </div>
  )
}
