# Known Bugs

This page lists **known bugs** in the Ekho application: confirmed product or application defects that are not yet fixed. It is separate from:

- **Troubleshooting** ([Developer guide](developer-guide.md#troubleshooting) — "Common Issues") — setup, environment, and how-to-fix guidance
- **Security** ([Security architecture](architecture/security-architecture.md) — "Known Vulnerabilities") — vulnerability management and tooling

## How to use this page

- **Add a bug** when it is confirmed (reproducible, not environment/setup) and not yet fixed. Optionally link to a GitHub issue.
- **Update status** when work starts (e.g. "In progress") or when the bug is fixed — then move the row to "Recently fixed" or remove it.
- **Review** the list during release prep or sprint planning so it stays current.

## Severity

| Severity | Meaning |
|----------|--------|
| **Critical** | Major feature broken or data loss risk; should be fixed ASAP. |
| **High** | Significant feature impaired; workaround may exist. |
| **Medium** | Noticeable defect; impact is limited or workaround is easy. |
| **Low** | Minor issue; cosmetic or edge case. |

## Open bugs

| ID | Title | Description | Area | Severity | Status | Discovered |
|----|-------|-------------|------|----------|--------|------------|
| BUG-001 | Back link in record detail view always goes to collection | When the user clicks the back link in the record detail view, the link always navigates to the collection page. Expected: it should navigate to the previous page (e.g. collection or records list view). | Frontend / Navigation | Medium | Open | 2025-02-14 |

## Recently fixed

| ID | Title | Area | Severity | Fixed in |
|----|-------|------|----------|----------|
| *(None)* | | | | |

Trim this section periodically (e.g. after a release) to avoid clutter.
