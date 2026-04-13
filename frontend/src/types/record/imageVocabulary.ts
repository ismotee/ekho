/**
 * Closed vocabularies for record-attached image metadata (`role`, `context`).
 *
 * Docs: docs/data/common-models.md — "Record-attached images: closed role and context".
 * API: docs/api-specification.md — "Record image role and context".
 * Backend mirror: backend/api/record_image_vocab.py
 */

export const RECORD_IMAGE_ROLES = [
  'thumbnail',
  'preview',
  'preservation_master',
  'access_derivative',
  'derivative',
  'print',
  'detail',
  'document_scan',
] as const

export type RecordImageRole = (typeof RECORD_IMAGE_ROLES)[number]

export const RECORD_IMAGE_CONTEXTS = [
  'portfolio',
  'exhibit',
  'archive',
  'documentation',
  'condition',
  'publication',
  'digitalization',
] as const

export type RecordImageContext = (typeof RECORD_IMAGE_CONTEXTS)[number]
