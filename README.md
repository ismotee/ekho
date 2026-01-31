# Ekho Web Application

A full-stack web application with TypeScript/React + MobX frontend and Django/Python backend.

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

## Documentation

- **[Agent Roles](docs/agent-roles/README.md)**: Comprehensive documentation of agent roles for the development team. Each role is documented in a separate file:
  - [Frontend Developer](docs/agent-roles/01-frontend-developer.md)
  - [Backend Developer](docs/agent-roles/02-backend-developer.md)
  - [Lead Architect](docs/agent-roles/03-lead-architect.md)
  - [Data Architect](docs/agent-roles/04-data-architect.md)
  - [Frontend Tester](docs/agent-roles/05-frontend-tester.md)
  - [Backend Tester](docs/agent-roles/06-backend-tester.md)
  - [Product Owner](docs/agent-roles/07-product-owner.md)
  - [DevOps Engineer](docs/agent-roles/08-devops-engineer.md)
  - [Technical Writer](docs/agent-roles/09-technical-writer.md)
  - [UI/UX Designer](docs/agent-roles/10-ui-ux-designer.md)