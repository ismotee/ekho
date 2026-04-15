# Ekho Web Application

A full-stack web application with TypeScript/React + MobX frontend and Django/Python backend.

---

## Documentation

Project documentation lives in the **`docs/`** directory. Summary:

| Area | Description |
|------|--------------|
| **[API Specification](docs/api-specification.md)** | REST API endpoints, authentication, request/response formats, and usage for the Ekho Art Collection Management Application. |
| **[Architecture](docs/architecture/)** | System and security architecture; architecture decision records (ADRs) for authentication, image storage, permissions, and API versioning. |
| **[Data & models](docs/data-models.md)** | Data models (User, Collection, Record), relationships, and constraints. See also [schema design](docs/data/schema-design.md), [models](docs/data/models.md), and [query optimization](docs/data/query-optimization.md) in `docs/data/`. |
| **[Design](docs/design/)** | UI/UX specs: authentication, collection and record management, navigation and layout, and the design system (colors, typography, components). |
| **[Developer guide](docs/developer-guide.md)** | Prerequisites, project setup, development workflow, code structure, testing, API and frontend development, database management, and troubleshooting. |
| **[Prep machine install](docs/deployment/prep-install.md)** | Repeatable local Django + SQLite setup for prep laptops (exhibition prep), scripts, optional UI, data locations, and pointers to the curator runbook. |
| **[Known Bugs](docs/known-bugs.md)** | List of confirmed product/application defects and their status; separate from troubleshooting and security. |
| **[Customer support guide](docs/customer-support.md)** | Internal guide for helping end users: permissions, records (`data` + representative image), search, common issues, escalation. |
| **[User stories](docs/user-stories/)** | Product-level user stories and acceptance criteria for authentication, collections, and records. |

---

## Windows One-Shot Full-Stack Setup

If the target machine may not have Python or Node.js installed, use this script from the repository root:

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\prep_install_fullstack.ps1
```

What it does in one run:

- Checks for `python`/`py`; installs Python 3.12 via `winget` if missing.
- Checks for `node` + `npm`; installs Node.js LTS via `winget` if missing.
- Refreshes `PATH` in-session after installs.
- Runs backend setup via `backend/scripts/prep_install.ps1`.
- Runs frontend dependency install with `npm install` in `frontend/`.

Note: this requires `winget` (App Installer) to be available on Windows.

---

## Project Structure

```
ekho/
├── frontend/          # React + TypeScript + MobX frontend
│   ├── src/
│   │   ├── stores/   # MobX stores
│   │   └── test/     # Frontend tests
│   └── package.json
├── backend/          # Django backend
│   ├── ekho_backend/ # Django project settings
│   ├── api/          # API app
│   │   └── tests/    # Backend tests
│   ├── pyproject.toml # Poetry configuration
│   └── requirements.txt
└── README.md
```

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Run tests:
   ```bash
   npm test
   ```

The frontend will be available at `http://localhost:3000`

## Backend Setup

### Using Poetry (Recommended)

1. Install Poetry if you haven't already:
   ```bash
   # Windows (PowerShell)
   (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
   
   # Linux/Mac
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

3. Install dependencies (Poetry will create a virtual environment automatically):
   ```bash
   poetry install
   ```

4. Activate the Poetry shell:
   ```bash
   poetry shell
   ```

5. Copy the environment file:
   ```bash
   copy .env.example .env
   ```
   (Linux/Mac: `cp .env.example .env`)

6. Run migrations:
   ```bash
   poetry run python manage.py migrate
   ```

7. Create a superuser (optional):
   ```bash
   poetry run python manage.py createsuperuser
   ```

8. Start the development server:
   ```bash
   poetry run python manage.py runserver
   ```

### Using pip (Alternative)

1. Create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - Linux/Mac:
     ```bash
     source venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Follow steps 4-8 from the Poetry setup above.

The backend will be available at `http://localhost:8000`

## Running Tests

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend
# Using Poetry
poetry run pytest

# Using pip
pytest
```

## Technologies

- **Frontend**: React 18, TypeScript, MobX, Vite
- **Backend**: Django 4.2, Django REST Framework, Poetry
- **Testing**: Vitest (frontend), pytest (backend)

