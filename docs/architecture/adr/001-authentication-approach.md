# ADR-001: Authentication Approach

## Status

Accepted

## Context

The application requires user authentication to allow users to create and manage their art collections. We need to choose between Django session authentication and JWT (JSON Web Tokens) authentication.

## Decision

We will use **Django Session Authentication** for the initial version of the application.

## Rationale

### Advantages of Session Authentication

1. **Simplicity**: Django's built-in session authentication is straightforward to implement and maintain
2. **Security**: Server-side session storage provides better security control
3. **Built-in Features**: Django provides session management, expiration, and CSRF protection out of the box
4. **Stateless Not Required**: Since we have a traditional client-server architecture, stateless authentication is not necessary
5. **Development Speed**: Faster to implement than JWT, allowing us to focus on core features
6. **Cookie-based**: Works seamlessly with browser-based applications

### Why Not JWT

1. **Complexity**: JWT requires additional libraries and more complex token management
2. **Refresh Token Management**: Requires implementing refresh token rotation and storage
3. **Token Revocation**: More complex to implement token revocation with JWT
4. **Not Stateless in Practice**: We still need database lookups for user data, so stateless benefit is limited

## Consequences

### Positive

- Faster development and implementation
- Leverages Django's built-in security features
- Easier to debug and maintain
- Better security control with server-side sessions

### Negative

- Requires server-side session storage (SQLite/PostgreSQL sessions table)
- Slightly more server memory usage for session storage
- If we need to scale to multiple servers, we'll need shared session storage (Redis)

### Migration Path

If we need to switch to JWT in the future:
- The API endpoints remain the same
- Only authentication middleware needs to change
- Frontend would need to store tokens instead of relying on cookies

## References

- Django Session Authentication: https://docs.djangoproject.com/en/4.2/topics/auth/default/
- Django REST Framework Authentication: https://www.django-rest-framework.org/api-guide/authentication/#sessionauthentication
