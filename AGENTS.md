# Ekho Sub-Agent Configuration

This file defines the **sub-agent roles** for the Ekho project. Use it to invoke role-specific behavior in Cursor.

**Workflow**: Documentation → Tests → Production Code → Review and Bug Fix → Update Documentation and Plans.

---

## How to Use a Sub-Agent

1. **Reference the rule**: In chat, reference the role rule so it is applied, e.g. `@.cursor/rules/agent-frontend-developer.mdc` or add the rule in Cursor's rule picker.
2. **Or name the role in your prompt**: e.g. "Act as the Frontend Tester and write tests for the new RecordList filters."
3. **Plans**: Existing plans (e.g. in `.cursor/plans/`) already reference roles by their rule paths.

### Target device (UI)

Ekho is deployed on **Samsung 11" tablets at 2000×1200**. Layout, touch targets, and accessibility must follow **`.cursor/rules/device-samsung-tablet-2000x1200.mdc`** (always applied with frontend and design paths).

---

## Sub-Agents (Roles)

| Role | Rule File | When to Use | Primary Paths |
|------|-----------|-------------|---------------|
| **Frontend Developer** | `agent-frontend-developer.mdc` | React/TypeScript/MobX implementation, component work | `frontend/**` |
| **Backend Developer** | `agent-backend-developer.mdc` | Django/DRF APIs, models, business logic | `backend/**` |
| **Lead Architect** | `agent-lead-architect.mdc` | Architecture, ADRs, system design, technical decisions | `docs/architecture/**`, codebase-wide |
| **Data Architect** | `agent-data-architect.mdc` | Schema, models, migrations, data design | `backend/api/**`, `docs/data/**` |
| **Frontend Tester** | `agent-frontend-tester.mdc` | Frontend tests (Vitest, RTL), E2E, coverage | `frontend/src/test/**`, `frontend/**/*.test.*` |
| **Backend Tester** | `agent-backend-tester.mdc` | Backend tests (pytest), API tests, coverage | `backend/api/tests/**` |
| **Product Owner** | `agent-product-owner.mdc` | User stories, acceptance criteria, backlog, requirements | `docs/user-stories/**`, `docs/plans/**` |
| **DevOps Engineer** | `agent-devops-engineer.mdc` | CI/CD, deployment, infrastructure, scripts | `.github/**`, `backend/**/settings*`, deployment configs |
| **Technical Writer** | `agent-technical-writer.mdc` | API docs, developer guides, specs, ADRs | `docs/**`, OpenAPI/specs |
| **UI/UX Designer** | `agent-ui-ux-designer.mdc` | Design specs, flows, accessibility, design system | `docs/design/**`, `frontend/**` (design intent) |

---

## Phase Mapping (Workflow)

- **Phase 1 (Documentation)**: Technical Writer, Lead Architect, Product Owner, Data Architect, UI/UX Designer
- **Phase 2 (Tests)**: Frontend Tester, Backend Tester, Frontend Developer, Backend Developer
- **Phase 3 (Production Code)**: Frontend Developer, Backend Developer, DevOps Engineer
- **Phase 4 (Review & Bug Fix)**: Frontend/Backend Developers and Testers (human review required)
- **Phase 5 (Update Docs & Plans)**: Technical Writer, Product Owner, Lead Architect

---

## Source

Role definitions are documented in `docs/agent-roles/`. This configuration converts those into Cursor rules in `.cursor/rules/` (prefix `agent-*.mdc`).
