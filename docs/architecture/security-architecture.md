# Security Architecture

This document describes the security architecture and measures implemented in the Ekho application.

## Security Overview

The application implements multiple layers of security to protect user data, prevent unauthorized access, and ensure data integrity.

## Authentication Security

### Session Authentication

- **Method**: Django Session Authentication (see ADR-001)
- **Session Storage**: Server-side sessions in database
- **Session Expiration**: Configurable timeout (default: 2 weeks)
- **Session Security**: 
  - Secure cookies (HTTPS in production)
  - HttpOnly flag to prevent XSS
  - SameSite attribute to prevent CSRF

### Password Security

- **Hashing**: Django's PBKDF2 password hasher
- **Salt**: Automatic salt generation per password
- **Minimum Length**: 8 characters (enforced in registration)
- **Storage**: Passwords are never stored in plain text

### CSRF Protection

- **Method**: Django's CSRF middleware
- **Token**: CSRF token included in forms
- **Validation**: Server-side validation of CSRF tokens
- **Exemptions**: API endpoints that don't use cookies may be exempt (if using token auth)

## Authorization Security

### Permission Model

- **Custom Permissions**: DRF permission classes (see ADR-003)
- **Owner-Based Access**: Only collection owners can modify their collections
- **Read-Only Access**: Anonymous users can view but not modify
- **Closed Collections**: Read-only for all users including owner

### Access Control Layers

1. **URL Level**: Authentication required for protected endpoints
2. **View Level**: Permission classes check ownership and status
3. **Serializer Level**: Validation of data and relationships
4. **Model Level**: Database constraints and validation

## Data Protection

### Input Validation

- **Model Validation**: Django model field validators
- **Serializer Validation**: DRF serializer validation
- **Type Checking**: TypeScript on frontend, Python type hints on backend
- **Sanitization**: Django's template auto-escaping, parameterized queries

### SQL Injection Prevention

- **ORM Usage**: Django ORM uses parameterized queries
- **No Raw SQL**: Avoid raw SQL queries where possible
- **Input Validation**: All user input is validated before database operations

### XSS Prevention

- **Template Escaping**: Django templates auto-escape by default
- **React Escaping**: React automatically escapes content
- **Content Security Policy**: Can be implemented in production

## File Upload Security

### Image Upload Validation

- **File Type Validation**: Only JPEG, PNG, GIF allowed
- **File Size Limits**: Maximum 10MB per file
- **MIME Type Checking**: Validate actual file type, not just extension
- **File Naming**: Use secure file naming (UUID or timestamp-based)

### File Storage Security

- **Upload Path**: Restricted to `media/records/` directory
- **Access Control**: Images are publicly accessible (read-only)
- **File Scanning**: Consider virus/malware scanning in production
- **Storage Isolation**: Separate from application code

### File Access

- **Public Read Access**: Images are publicly viewable (no authentication required)
- **No Direct Upload**: All uploads go through API validation
- **File Cleanup**: Deleted records trigger image file deletion

## API Security

### Endpoint Security

- **Authentication Required**: Protected endpoints require authentication
- **Permission Checks**: Each endpoint validates permissions
- **Rate Limiting**: Can be implemented in production
- **CORS Configuration**: Configured for specific frontend origins

### Request Validation

- **Data Validation**: All request data is validated
- **Type Checking**: Type validation in serializers
- **Size Limits**: Request size limits to prevent DoS
- **Error Messages**: Generic error messages to prevent information leakage

## Data Privacy

### User Data

- **Minimal Data**: Only collect necessary user data
- **Password Security**: Passwords are hashed and never exposed
- **Session Data**: Session data stored securely on server
- **Data Access**: Users can only access their own data

### Collection and Record Data

- **Owner Privacy**: Collection owners control access
- **Public Viewing**: Collections and records are publicly viewable (by design)
- **Data Deletion**: Users can delete their collections and records
- **Cascade Deletion**: Related data is deleted when parent is deleted

## Security Headers

### Recommended Headers (Production)

- **X-Content-Type-Options**: `nosniff`
- **X-Frame-Options**: `DENY` or `SAMEORIGIN`
- **X-XSS-Protection**: `1; mode=block`
- **Strict-Transport-Security**: `max-age=31536000; includeSubDomains` (HTTPS only)
- **Content-Security-Policy**: Configure based on requirements

## Security Best Practices

### Development

1. **Never Commit Secrets**: Use environment variables
2. **Use HTTPS**: In production, always use HTTPS
3. **Keep Dependencies Updated**: Regularly update packages
4. **Code Review**: Review all code changes
5. **Security Testing**: Include security in testing

### Production

1. **Environment Variables**: Store secrets in environment variables
2. **HTTPS Only**: Enforce HTTPS connections
3. **Security Headers**: Implement security headers
4. **Regular Updates**: Keep dependencies and Django updated
5. **Monitoring**: Monitor for security issues
6. **Backup Strategy**: Regular backups of database and files
7. **Access Logging**: Log access for security auditing

## Vulnerability Management

### Known Vulnerabilities

- Monitor Django security advisories
- Monitor dependency security advisories
- Use tools like `safety` or `npm audit` to check for vulnerabilities

### Response Plan

1. **Identify**: Monitor for security vulnerabilities
2. **Assess**: Evaluate severity and impact
3. **Patch**: Apply security patches promptly
4. **Test**: Test patches before deployment
5. **Deploy**: Deploy patches to production
6. **Communicate**: Inform users if necessary

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables
- [ ] HTTPS configured
- [ ] Security headers configured
- [ ] Dependencies updated and scanned
- [ ] File upload validation implemented
- [ ] Permission checks verified
- [ ] Input validation tested
- [ ] Error messages don't leak information
- [ ] Session security configured
- [ ] CORS properly configured

## References

- Django Security: https://docs.djangoproject.com/en/4.2/topics/security/
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Django REST Framework Security: https://www.django-rest-framework.org/topics/security/
