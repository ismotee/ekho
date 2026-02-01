# User Stories: Record Management

## US-010: Create Record

**As a** collection owner  
**I want to** create a new art record in my collection  
**So that** I can catalog my artwork

### Acceptance Criteria

- [ ] Collection owner can access a "Create Record" form
- [ ] Create form includes all required fields: Title, Artist, Year, Medium, Dimensions, Description, Condition, Image
- [ ] Title and Artist are required fields
- [ ] Year, Medium, Dimensions, Description, Condition are optional
- [ ] Image upload is optional
- [ ] User can upload an image file (JPG, PNG, etc.)
- [ ] Image preview is shown after selection
- [ ] Form validation provides clear error messages
- [ ] Upon successful creation, record is saved to the collection
- [ ] User is redirected to the record detail page or collection detail page
- [ ] Record appears in the collection's record list
- [ ] Non-owners cannot create records (form not accessible or access denied)
- [ ] Records cannot be created in closed collections (form disabled or access denied)

### Technical Notes

- Record fields:
  - Title: required, max 200 characters
  - Artist: required, max 200 characters
  - Year: optional, integer, valid year range
  - Medium: optional, max 100 characters
  - Dimensions: optional, max 100 characters (e.g., "24x36 inches")
  - Description: optional, text field, max 2000 characters
  - Condition: optional, max 200 characters
  - Image: optional, image file (JPG, PNG, GIF), max size 10MB
- Record is automatically associated with the collection
- Owner is implicitly the collection owner
- Timestamps (created_at, updated_at) are automatically set

---

## US-011: Edit Record

**As a** collection owner  
**I want to** edit an existing art record  
**So that** I can update record information

### Acceptance Criteria

- [ ] Collection owner can access an "Edit Record" form
- [ ] Edit form is pre-populated with current record data
- [ ] Owner can modify all record fields
- [ ] Owner can replace the image
- [ ] Owner can save changes
- [ ] Changes are persisted to the database
- [ ] Updated record information is displayed immediately
- [ ] Non-owners cannot edit records (no edit option visible or access denied)
- [ ] Records in closed collections cannot be edited (edit option disabled or access denied)
- [ ] Form validation provides clear error messages

### Technical Notes

- Only the collection owner can edit records
- Records in collections with `is_closed=True` cannot be edited
- Updated_at timestamp is automatically updated
- Image replacement should handle file upload
- Use PATCH or PUT endpoint for updates

---

## US-012: Delete Record

**As a** collection owner  
**I want to** delete an art record  
**So that** I can remove incorrect or unwanted entries

### Acceptance Criteria

- [ ] Collection owner can access a "Delete Record" option
- [ ] Deleting a record requires confirmation (dialog/modal)
- [ ] Confirmation dialog shows record title and warns about permanent deletion
- [ ] Upon confirmation, record is permanently deleted from the database
- [ ] Associated image file is also deleted (if exists)
- [ ] Record is removed from the collection's record list
- [ ] User is redirected to the collection detail page
- [ ] Non-owners cannot delete records (no delete option visible or access denied)
- [ ] Records in closed collections cannot be deleted (delete option disabled or access denied)
- [ ] Success message confirms deletion

### Technical Notes

- Only the collection owner can delete records
- Records in collections with `is_closed=True` cannot be deleted
- Image file deletion should be handled (cleanup)
- Use DELETE endpoint
- Consider soft delete vs hard delete (initial version: hard delete)

---

## US-013: View Records

**As a** user (authenticated or anonymous)  
**I want to** view records in a collection  
**So that** I can browse the artwork

### Acceptance Criteria

- [ ] Both authenticated and anonymous users can view records in a collection
- [ ] Records are displayed in a list or grid view
- [ ] Each record shows: title, artist, year, thumbnail image (if available)
- [ ] Records can be filtered or sorted (optional for initial version)
- [ ] User can click on a record to view its details
- [ ] Record list is paginated if there are many records
- [ ] Empty state is shown when collection has no records
- [ ] Loading state is shown while fetching records

### Technical Notes

- Endpoint should be accessible to both authenticated and anonymous users
- Consider pagination (default: 20-50 items per page)
- Include thumbnail URLs in the response
- Filter by collection (required)

---

## US-014: View Record Details

**As a** user (authenticated or anonymous)  
**I want to** view detailed information about a specific art record  
**So that** I can see all the artwork information

### Acceptance Criteria

- [ ] Both authenticated and anonymous users can view record details
- [ ] Record detail page shows all fields: Title, Artist, Year, Medium, Dimensions, Description, Condition, Image
- [ ] Image is displayed at a reasonable size with option to view full size
- [ ] Owner sees edit and delete options (if collection not closed)
- [ ] Non-owners and anonymous users see read-only view
- [ ] Navigation back to collection or record list is available
- [ ] Record information is clearly formatted and readable

### Technical Notes

- Endpoint should be accessible to both authenticated and anonymous users
- Include all record fields in the response
- Include full image URL in the response
- Owner-specific actions should be conditionally rendered in the frontend

---

## US-015: Upload Image for Record

**As a** collection owner  
**I want to** upload an image file for an art record  
**So that** I can include visual documentation of the artwork

### Acceptance Criteria

- [ ] Owner can select an image file during record creation or editing
- [ ] Supported file formats: JPG, PNG, GIF
- [ ] Maximum file size: 10MB
- [ ] Image preview is shown after selection (before upload)
- [ ] Image is uploaded and stored securely
- [ ] Image URL is associated with the record
- [ ] Image is displayed in record list and detail views
- [ ] Invalid file types are rejected with clear error message
- [ ] Files exceeding size limit are rejected with clear error message
- [ ] Image can be replaced when editing a record

### Technical Notes

- Image storage: local filesystem (development) or cloud storage (production)
- Image validation: file type and size checks
- Image optimization: consider resizing/compression for thumbnails
- Security: validate file types, scan for malicious content
- Image URL should be accessible to both authenticated and anonymous users
- Consider generating thumbnails for list views
