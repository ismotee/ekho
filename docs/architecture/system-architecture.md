# System Architecture

This document describes the overall system architecture for the Ekho Art Collection Management Application.

## Architecture Overview

Ekho is a full-stack web application following a client-server architecture with a React frontend and Django REST Framework backend.

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         React Frontend (TypeScript)             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│  │  │   UI     │  │  MobX    │  │   API    │     │   │
│  │  │Components│  │  Stores  │  │  Client  │     │   │
│  │  └──────────┘  └──────────┘  └──────────┘     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP/REST
┌─────────────────────────────────────────────────────────┐
│                    Server Layer                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │      Django REST Framework API                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │   │
│  │  │ Views/   │  │Serializers│  │Permissions│     │   │
│  │  │ViewSets  │  │          │  │          │     │   │
│  │  └──────────┘  └──────────┘  └──────────┘      │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Django ORM & Business Logic               │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │              SQLite Database                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │   │
│  │  │  Users   │  │Collections│  │ Records │      │   │
│  │  └──────────┘  └──────────┘  └──────────┘      │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │            File Storage (Media)                   │   │
│  │         (Image files for records)                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

- **Framework**: React 18
- **Language**: TypeScript
- **State Management**: MobX
- **Build Tool**: Vite
- **Testing**: Vitest
- **HTTP Client**: Fetch API or Axios

### Backend

- **Framework**: Django 4.2
- **API Framework**: Django REST Framework
- **Language**: Python 3.10+
- **Database**: SQLite (development), PostgreSQL (production-ready)
- **Authentication**: Django Session Authentication
- **Testing**: pytest

## System Components

### Frontend Architecture

#### Component Structure

```
App
├── Layout
│   ├── Navigation
│   └── UserMenu
├── Auth
│   ├── LoginForm
│   ├── RegisterForm
│   └── LogoutButton
├── Collections
│   ├── CollectionList
│   ├── CollectionCard
│   ├── CollectionDetail
│   ├── CollectionForm
│   └── CloseCollectionDialog
└── Records
    ├── RecordList
    ├── RecordCard
    ├── RecordDetail
    ├── RecordForm
    └── ImageUpload
```

#### State Management (MobX)

- **AuthStore**: User authentication state
- **CollectionStore**: Collection data and operations
- **RecordStore**: Record data and operations

#### API Communication

- Centralized API client (`services/api.ts`)
- Request/response interceptors
- Error handling
- Session management

### Backend Architecture

#### Application Structure

```
ekho_backend/
├── api/                    # Main API application
│   ├── models.py          # Data models
│   ├── serializers.py     # Data serialization
│   ├── views.py           # API endpoints
│   ├── permissions.py     # Access control
│   └── urls.py            # URL routing
└── ekho_backend/          # Project settings
    ├── settings.py         # Configuration
    └── urls.py            # Root URLs
```

#### API Layer

- **ViewSets**: RESTful endpoints using DRF ViewSets
- **Serializers**: Request/response data transformation
- **Permissions**: Custom permission classes for access control
- **Pagination**: Page-based pagination for list endpoints

#### Business Logic

- Model-level validation
- Serializer-level validation
- Permission checks in views
- Cascade delete handling

## Communication Patterns

### Frontend-Backend Communication

1. **REST API**: HTTP methods (GET, POST, PUT, PATCH, DELETE)
2. **JSON**: Request and response data format
3. **Session Authentication**: Cookie-based session management
4. **CORS**: Configured for frontend-backend communication

### Request Flow

```
User Action
    ↓
React Component
    ↓
MobX Store Action
    ↓
API Client (services/api.ts)
    ↓
HTTP Request (REST API)
    ↓
Django View/ViewSet
    ↓
Serializer Validation
    ↓
Permission Check
    ↓
Business Logic
    ↓
Database Operation
    ↓
Response
    ↓
MobX Store Update
    ↓
React Component Re-render
```

## Data Flow

### Authentication Flow

```
1. User submits login form
2. Frontend sends POST /api/auth/login/
3. Backend validates credentials
4. Backend creates session
5. Backend returns user data + session cookie
6. Frontend stores user in AuthStore
7. Frontend includes session cookie in subsequent requests
```

### Collection Management Flow

```
1. User creates collection
2. Frontend sends POST /api/collections/
3. Backend validates data
4. Backend checks permissions (authenticated user)
5. Backend creates collection with owner = current user
6. Backend returns collection data
7. Frontend updates CollectionStore
8. UI updates to show new collection
```

### Record Management Flow

```
1. User creates record with image
2. Frontend sends multipart/form-data POST /api/records/
3. Backend validates data and file
4. Backend checks permissions (collection owner, not closed)
5. Backend saves record and image file
6. Backend returns record data with image URL
7. Frontend updates RecordStore
8. UI updates to show new record
```

## State Management Architecture

### MobX Store Pattern

Each store follows this pattern:

```typescript
class Store {
  // Observable state
  items: Item[] = [];
  loading = false;
  error: string | null = null;
  
  // Actions
  async fetchItems() { ... }
  async createItem(data) { ... }
  async updateItem(id, data) { ... }
  async deleteItem(id) { ... }
  
  // Computed values
  get itemCount() { ... }
}
```

### State Updates

- Stores are reactive (MobX observables)
- Components observe stores
- Actions update stores
- Components automatically re-render on state changes

## Security Architecture

### Authentication

- **Method**: Django Session Authentication
- **Session Storage**: Server-side sessions
- **Session Expiration**: Configurable (default: 2 weeks)
- **CSRF Protection**: Enabled via Django middleware

### Authorization

- **Permission Classes**: Custom DRF permission classes
- **Owner-Based Access**: Collections and records owned by users
- **Read-Only Access**: Anonymous users can view, not modify
- **Closed Collections**: Read-only for all users including owner

### Data Protection

- **Password Hashing**: Django's PBKDF2 password hasher
- **Input Validation**: Model and serializer validation
- **File Upload Security**: File type and size validation
- **SQL Injection Protection**: Django ORM parameterized queries

## Scalability Considerations

### Current Architecture (Initial Version)

- Monolithic Django application
- SQLite database (development)
- Single server deployment
- File-based image storage

### Future Scalability Options

- **Database**: Migrate to PostgreSQL for production
- **Image Storage**: Cloud storage (AWS S3, Azure Blob, etc.)
- **Caching**: Redis for session storage and caching
- **Load Balancing**: Multiple application servers
- **CDN**: For static files and images
- **Database Replication**: For read scalability

## Performance Optimization

### Backend

- Database indexes on frequently queried fields
- Pagination for list endpoints
- `select_related()` and `prefetch_related()` for related data
- Image optimization (resize, compression)

### Frontend

- Code splitting and lazy loading
- Image lazy loading
- API response caching (MobX stores)
- Bundle size optimization

## Deployment Architecture

### Development

```
┌─────────────┐
│   React     │  localhost:5173
│  Frontend   │
└──────┬──────┘
       │
       │ HTTP
       │
┌──────▼──────┐
│   Django    │  localhost:8000
│   Backend   │
└──────┬──────┘
       │
       │ SQL
       │
┌──────▼──────┐
│   SQLite    │
│  Database   │
└─────────────┘
```

### Production (Future)

```
┌─────────────┐
│   CDN       │  Static files, images
└─────────────┘
       │
┌──────▼──────┐
│   React     │  Built static files
│  Frontend   │
└──────┬──────┘
       │
       │ HTTPS
       │
┌──────▼──────┐
│   Django    │  Application server(s)
│   Backend   │
└──────┬──────┘
       │
       │
┌──────▼──────┐
│ PostgreSQL  │  Database
│  Database   │
└─────────────┘
```

## References

- **User Stories**: See `docs/user-stories/`
- **API Specification**: See `docs/api-specification.md`
- **Data Models**: See `docs/data-models.md`
- **Design Documentation**: See `docs/design/`
- **ADRs**: See `docs/architecture/adr/`
