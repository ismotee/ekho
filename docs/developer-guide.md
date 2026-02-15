# Developer Guide

This guide provides comprehensive instructions for setting up, developing, and contributing to the Ekho Art Collection Management Application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Development Workflow](#development-workflow)
4. [Code Structure](#code-structure)
5. [Testing Guidelines](#testing-guidelines)
6. [API Development](#api-development)
7. [Frontend Development](#frontend-development)
8. [Database Management](#database-management)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: Version 18.x or higher
- **Python**: Version 3.10 or higher
- **Poetry**: For Python dependency management (recommended) or pip
- **Git**: For version control
- **SQLite**: Included with Python (development database)

### Recommended Tools

- **VS Code** or **Cursor**: Code editor
- **Postman** or **Insomnia**: API testing
- **Browser DevTools**: For frontend debugging

## Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ekho
```

### 2. Backend Setup

#### Using Poetry (Recommended)

```bash
cd backend
poetry install
poetry shell
poetry run python manage.py migrate
poetry run python manage.py createsuperuser  # Optional
poetry run python manage.py runserver
```

#### Using pip

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # Optional
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` (Vite default port)

### 4. Environment Configuration

#### Backend Environment Variables

Create a `.env` file in the `backend/` directory (if needed):

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///db.sqlite3
MEDIA_ROOT=media
```

#### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Development Workflow

### Workflow Overview

The project follows a **Documentation → Tests → Production Code** workflow:

1. **Documentation Phase**: Create/update documentation
2. **Test Phase**: Write tests based on documentation
3. **Production Code Phase**: Implement code to pass tests

### Git Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

3. Push and create pull request:
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Review Process

1. All code must be reviewed before merging
2. Tests must pass
3. Code must follow style guidelines
4. Documentation must be updated if needed

## Code Structure

### Backend Structure

```
backend/
├── api/                    # Main API application
│   ├── models.py          # Django models
│   ├── serializers.py     # DRF serializers
│   ├── views.py           # API views/viewsets
│   ├── permissions.py      # Custom permissions
│   ├── urls.py            # API URL routing
│   └── tests/             # Test files
│       ├── test_auth.py
│       ├── test_collections.py
│       └── test_records.py
├── ekho_backend/          # Django project settings
│   ├── settings.py        # Django settings
│   ├── urls.py            # Root URL configuration
│   └── wsgi.py            # WSGI configuration
├── manage.py              # Django management script
├── pyproject.toml         # Poetry configuration
└── requirements.txt       # Python dependencies
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── auth/         # Authentication components
│   │   ├── collections/  # Collection components
│   │   ├── records/      # Record components
│   │   └── layout/       # Layout components
│   ├── stores/           # MobX stores
│   │   ├── authStore.ts
│   │   ├── collectionStore.ts
│   │   └── recordStore.ts
│   ├── services/         # API services
│   │   └── api.ts        # API client
│   ├── test/             # Test files
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── public/               # Static files
├── package.json          # npm dependencies
└── vite.config.ts       # Vite configuration
```

### Documentation Structure

```
docs/
├── agent-roles/          # Agent role documentation
├── user-stories/         # User stories
├── design/              # UI/UX design documentation
├── api-specification.md # API documentation
├── data-models.md       # Data model documentation
└── developer-guide.md   # This file
```

## Testing Guidelines

### Backend Testing

#### Running Tests

```bash
cd backend
poetry run pytest          # Run all tests
poetry run pytest -v       # Verbose output
poetry run pytest api/tests/test_auth.py  # Run specific test file
poetry run pytest --cov    # With coverage
```

#### Writing Tests

- Use pytest and Django's TestCase
- Follow AAA pattern: Arrange, Act, Assert
- Test both success and error cases
- Aim for >85% code coverage

Example:

```python
from django.test import TestCase
from django.contrib.auth.models import User
from api.models import Collection

class CollectionTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    def test_create_collection(self):
        collection = Collection.objects.create(
            name='Test Collection',
            owner=self.user
        )
        self.assertEqual(collection.name, 'Test Collection')
        self.assertEqual(collection.owner, self.user)
```

### Frontend Testing

#### Running Tests

```bash
cd frontend
npm test                  # Run all tests
npm test -- --watch       # Watch mode
npm test -- --coverage    # With coverage
```

#### Writing Tests

- Use Vitest and React Testing Library
- Test component rendering and user interactions
- Test store behavior
- Aim for >80% code coverage

Example:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CollectionList } from './CollectionList';

describe('CollectionList', () => {
  it('renders collection cards', () => {
    const collections = [
      { id: 1, name: 'Test Collection', owner: 'user1' }
    ];
    render(<CollectionList collections={collections} />);
    expect(screen.getByText('Test Collection')).toBeInTheDocument();
  });
});
```

## API Development

### Creating a New Endpoint

1. **Define the Model** (if needed) in `api/models.py`
2. **Create Migration**: `python manage.py makemigrations`
3. **Run Migration**: `python manage.py migrate`
4. **Create Serializer** in `api/serializers.py`
5. **Create View/ViewSet** in `api/views.py`
6. **Add URL Route** in `api/urls.py`
7. **Write Tests** in `api/tests/`
8. **Update API Documentation** in `docs/api-specification.md`

### API Best Practices

- Use DRF ViewSets for CRUD operations
- Implement proper permissions
- Validate input data
- Return consistent error responses
- Use pagination for list endpoints
- Document endpoints in API specification

## Frontend Development

### Creating a New Component

1. **Create Component File** in appropriate directory
2. **Define TypeScript Types/Interfaces**
3. **Implement Component** with React hooks
4. **Connect to MobX Store** (if needed)
5. **Add Styling** (CSS modules or styled-components)
6. **Write Tests** in `src/test/`
7. **Update Design Documentation** if UI changes

### Frontend Best Practices

- Use TypeScript for type safety
- Follow React best practices (hooks, functional components)
- Use MobX for state management
- Implement proper error handling
- Make components accessible (WCAG 2.1 AA)
- Optimize performance (lazy loading, memoization)

### MobX Store Pattern

```typescript
import { makeAutoObservable } from 'mobx';

class CollectionStore {
  collections: Collection[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchCollections() {
    this.loading = true;
    try {
      const response = await api.get('/collections/');
      this.collections = response.data.results;
    } catch (error) {
      this.error = 'Failed to fetch collections';
    } finally {
      this.loading = false;
    }
  }
}
```

## Database Management

### Creating Migrations

```bash
cd backend
poetry run python manage.py makemigrations
poetry run python manage.py migrate
```

### Resetting Database (Development Only)

```bash
cd backend
rm db.sqlite3
poetry run python manage.py migrate
poetry run python manage.py createsuperuser
```

### Database Backup

```bash
# SQLite backup
cp db.sqlite3 db.sqlite3.backup
```

## Troubleshooting

### Common Issues

#### Backend Issues

**Issue**: Migration errors
- **Solution**: Delete migration files and recreate, or reset database

**Issue**: Port already in use
- **Solution**: Change port: `python manage.py runserver 8001`

**Issue**: CORS errors
- **Solution**: Check CORS settings in `settings.py`, ensure frontend URL is allowed

#### Frontend Issues

**Issue**: API connection errors
- **Solution**: Check `VITE_API_BASE_URL` in `.env`, ensure backend is running

**Issue**: Module not found
- **Solution**: Delete `node_modules` and `package-lock.json`, run `npm install`

**Issue**: TypeScript errors
- **Solution**: Check type definitions, ensure types are properly imported

### Getting Help

1. Check existing documentation
2. Review error messages carefully
3. Check [Known Bugs](known-bugs.md) for confirmed product bugs
4. Check GitHub issues (if applicable)
5. Ask team members for assistance
6. Review code examples in the codebase

## Code Style

### Python (Backend)

- Follow PEP 8 style guide
- Use Black for code formatting (if configured)
- Maximum line length: 88-100 characters
- Use type hints where appropriate

### TypeScript (Frontend)

- Follow ESLint rules
- Use Prettier for formatting (if configured)
- Maximum line length: 100 characters
- Use meaningful variable and function names

## Performance Considerations

### Backend

- Use database indexes for frequently queried fields
- Implement pagination for list endpoints
- Use `select_related()` and `prefetch_related()` for queries
- Optimize image handling (resize, compress)

### Frontend

- Lazy load components and routes
- Optimize images (compression, appropriate formats)
- Implement proper caching strategies
- Minimize bundle size

## Security Best Practices

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Validate and sanitize all user input
- Implement proper authentication and authorization
- Use HTTPS in production
- Regularly update dependencies
- Scan for security vulnerabilities

## Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Static files collected
- [ ] Security settings reviewed
- [ ] Performance tested

### Deployment Steps

1. Set production environment variables
2. Run database migrations
3. Collect static files: `python manage.py collectstatic`
4. Build frontend: `npm run build`
5. Deploy to production server
6. Verify deployment

## Resources

### Documentation

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [MobX Documentation](https://mobx.js.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

### Project-Specific Documentation

- [User Stories](docs/user-stories/)
- [API Specification](docs/api-specification.md)
- [Data Models](docs/data-models.md)
- [Design Documentation](docs/design/)

## Contributing

1. Read and understand the development workflow
2. Follow code style guidelines
3. Write tests for new features
4. Update documentation as needed
5. Submit pull requests for review
6. Address feedback and iterate

## Support

For questions or issues, please:
1. Check this developer guide
2. Review project documentation
3. Contact the development team
4. Create an issue in the project repository
