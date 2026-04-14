"""
Closed vocabularies for record-attached image metadata (role, context).

Docs: docs/data/common-models.md — "Record-attached images: closed role and context".
API: docs/api-specification.md — "Record image role and context".
"""

from __future__ import annotations

# Wire values are snake_case strings; keep in sync with docs and frontend/src/types/record/imageVocabulary.ts

RECORD_IMAGE_ROLES: tuple[str, ...] = (
    "thumbnail",
    "preview",
    "preservation_master",
    "access_derivative",
    "derivative",
    "print",
    "detail",
    "document_scan",
)

RECORD_IMAGE_CONTEXTS: tuple[str, ...] = (
    "portfolio",
    "exhibit",
    "archive",
    "documentation",
    "condition",
    "object_condition_survey",
    "publication",
    "digitalization",
)

RECORD_IMAGE_ROLE_SET: frozenset[str] = frozenset(RECORD_IMAGE_ROLES)
RECORD_IMAGE_CONTEXT_SET: frozenset[str] = frozenset(RECORD_IMAGE_CONTEXTS)

RECORD_IMAGE_STATUSES: tuple[str, ...] = ("draft", "approved", "suppressed")

RECORD_IMAGE_STATUS_SET: frozenset[str] = frozenset(RECORD_IMAGE_STATUSES)
