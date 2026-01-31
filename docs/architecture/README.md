# Architecture Documentation

This directory contains architecture documentation for the Ekho Art Collection Management Application.

## Documents

1. **[System Architecture](system-architecture.md)** - Overall system design, components, and communication patterns
2. **[Security Architecture](security-architecture.md)** - Security measures, authentication, authorization, and data protection
3. **[Architecture Decision Records (ADRs)](adr/)** - Key technical decisions and their rationale

## Architecture Decision Records (ADRs)

1. **[ADR-001: Authentication Approach](adr/001-authentication-approach.md)** - Django Session Authentication vs JWT
2. **[ADR-002: Image Storage Strategy](adr/002-image-storage-strategy.md)** - Local filesystem vs cloud storage
3. **[ADR-003: Permission Model](adr/003-permission-model.md)** - Custom DRF permissions vs Django permissions
4. **[ADR-004: API Versioning Strategy](adr/004-api-versioning-strategy.md)** - No versioning initially, URL-based for future

## Related Documentation

- **User Stories**: See `docs/user-stories/`
- **API Specification**: See `docs/api-specification.md`
- **Data Models**: See `docs/data-models.md`
- **Database Schema**: See `docs/data/schema-design.md`
- **Design Documentation**: See `docs/design/`

## Architecture Principles

1. **Separation of Concerns**: Clear separation between frontend and backend
2. **RESTful API**: Standard REST API design principles
3. **Security First**: Authentication, authorization, and data protection
4. **Scalability**: Design for future growth and scaling
5. **Maintainability**: Clear architecture and documentation

## System Overview

```
Frontend (React) ↔ REST API ↔ Backend (Django) ↔ Database (SQLite/PostgreSQL)
```

- **Frontend**: React 18, TypeScript, MobX
- **Backend**: Django 4.2, Django REST Framework
- **Database**: SQLite (development), PostgreSQL (production-ready)
- **Authentication**: Django Session Authentication
- **File Storage**: Local filesystem (development), cloud storage (production)

## Key Architectural Decisions

- **Authentication**: Session-based (see ADR-001)
- **Image Storage**: Local filesystem with cloud migration path (see ADR-002)
- **Permissions**: Custom DRF permission classes (see ADR-003)
- **API Versioning**: No versioning initially (see ADR-004)

## Future Considerations

- Migration to PostgreSQL for production
- Cloud storage for images
- Caching layer (Redis)
- CDN for static files and images
- Load balancing for multiple servers
- Database replication for read scalability
