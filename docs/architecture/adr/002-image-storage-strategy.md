# ADR-002: Image Storage Strategy

## Status

Accepted

## Context

The application needs to store image files for art records. We need to decide between local filesystem storage (development approach) and cloud storage (production approach).

## Decision

We will use **local filesystem storage for development** and design the system to be **easily migratable to cloud storage for production**.

## Rationale

### Development: Local Filesystem

1. **Simplicity**: No external dependencies or configuration needed
2. **Cost**: No storage costs during development
3. **Speed**: Fast local file access
4. **Django Support**: Django's `FileField` and `ImageField` work seamlessly with local storage
5. **Easy Testing**: Simple to test file uploads locally

### Production: Cloud Storage (Future)

1. **Scalability**: Cloud storage scales automatically
2. **CDN Integration**: Easy to serve images via CDN
3. **Backup**: Automatic backups and redundancy
4. **Cost-Effective**: Pay only for storage used
5. **Performance**: Global distribution for faster image loading

### Abstraction Layer

We will use Django's storage backend abstraction, allowing us to switch between local and cloud storage by changing settings:

```python
# Development
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
MEDIA_ROOT = 'media'

# Production (future)
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_STORAGE_BUCKET_NAME = 'ekho-media'
```

## Consequences

### Positive

- Simple development setup
- Easy to test locally
- Flexible migration path to cloud storage
- No vendor lock-in (can switch cloud providers)

### Negative

- Local storage doesn't scale across multiple servers
- Need to migrate files when moving to production
- Local storage requires backup strategy

### Implementation Notes

1. **Single-replica production (Railway)**: Optional **volume + nginx** in front of Gunicorn serves `/media/` from disk while Django uses the same path via `EKHO_MEDIA_ROOT` — see [docs/deployment/railway-docker-media.md](../../deployment/railway-docker-media.md).
2. **File Organization**: Store images in `media/records/` directory
3. **File Naming**: Use Django's default file naming (UUID or timestamp-based)
4. **File Validation**: Validate file type and size in serializer
5. **File Cleanup**: Delete image files when records are deleted

### Migration to Cloud Storage

When ready for production:
1. Install storage backend library (e.g., `django-storages`)
2. Configure cloud storage credentials
3. Update `DEFAULT_FILE_STORAGE` setting
4. Migrate existing files to cloud storage
5. Update `MEDIA_URL` to point to cloud storage/CDN

## References

- Django File Storage: https://docs.djangoproject.com/en/4.2/topics/files/
- django-storages: https://django-storages.readthedocs.io/
