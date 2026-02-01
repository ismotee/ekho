# User Stories: Collection Management

## US-005: Create Collection

**As an** authenticated user  
**I want to** create a new art collection  
**So that** I can organize my art records

### Acceptance Criteria

- [ ] Authenticated user can access a "Create Collection" form
- [ ] Collection form requires a name field
- [ ] Collection form has an optional description field
- [ ] User can submit the form to create a collection
- [ ] Upon successful creation, collection is saved with the current user as owner
- [ ] User is redirected to the newly created collection detail page
- [ ] Collection appears in the user's collection list
- [ ] Anonymous users cannot access the create collection form
- [ ] Form validation provides clear error messages for invalid input

### Technical Notes

- Collection name: required, max 200 characters
- Collection description: optional, max 1000 characters
- Collection owner is automatically set to the authenticated user
- Collection is created with `is_closed=False` by default
- Timestamps (created_at, updated_at) are automatically set

---

## US-006: Edit Collection

**As a** collection owner  
**I want to** edit my collection's name and description  
**So that** I can update collection information

### Acceptance Criteria

- [ ] Collection owner can access an "Edit Collection" form
- [ ] Edit form is pre-populated with current collection data
- [ ] Owner can modify name and description
- [ ] Owner can save changes
- [ ] Changes are persisted to the database
- [ ] Updated collection information is displayed immediately
- [ ] Non-owners cannot edit the collection (no edit option visible or access denied)
- [ ] Closed collections cannot be edited (edit option disabled or access denied)
- [ ] Form validation provides clear error messages

### Technical Notes

- Only the collection owner can edit
- Collections with `is_closed=True` cannot be edited
- Updated_at timestamp is automatically updated
- Use PATCH or PUT endpoint for updates

---

## US-007: Close Collection

**As a** collection owner  
**I want to** close my collection (make it read-only)  
**So that** I can prevent further modifications while keeping it viewable

### Acceptance Criteria

- [ ] Collection owner can access a "Close Collection" option
- [ ] Closing a collection requires confirmation (dialog/modal)
- [ ] Confirmation dialog explains that closing makes the collection read-only
- [ ] Upon confirmation, collection's `is_closed` status is set to `True`
- [ ] Closed collection can still be viewed by owner and anonymous users
- [ ] Closed collection cannot be edited (name, description)
- [ ] Records in closed collection cannot be created, edited, or deleted
- [ ] Non-owners cannot close collections
- [ ] Closed collections are visually indicated (badge, icon, or styling)

### Technical Notes

- Closing is a one-way operation (cannot be reopened in initial version)
- Closing affects all records in the collection (makes them read-only)
- Use PATCH endpoint to update `is_closed` field
- Consider adding a confirmation step to prevent accidental closure

---

## US-008: View Collections

**As a** user (authenticated or anonymous)  
**I want to** view a list of all collections  
**So that** I can browse available art collections

### Acceptance Criteria

- [ ] Both authenticated and anonymous users can view the collections list
- [ ] Collections are displayed in a list or grid view
- [ ] Each collection shows: name, description (truncated), owner username, creation date
- [ ] Collections can be filtered or sorted (optional for initial version)
- [ ] User can click on a collection to view its details
- [ ] Collection list is paginated if there are many collections
- [ ] Empty state is shown when no collections exist
- [ ] Loading state is shown while fetching collections

### Technical Notes

- Endpoint should be accessible to both authenticated and anonymous users
- Consider pagination (default: 20-50 items per page)
- Include owner information in the response
- Include `is_closed` status in the response
- Consider including a count of records in each collection

---

## US-009: View Collection Details

**As a** user (authenticated or anonymous)  
**I want to** view detailed information about a specific collection  
**So that** I can see collection information and its records

### Acceptance Criteria

- [ ] Both authenticated and anonymous users can view collection details
- [ ] Collection detail page shows: name, description, owner, creation date, update date, closed status
- [ ] Collection detail page shows all records in the collection
- [ ] Owner sees edit and close options (if not closed)
- [ ] Non-owners and anonymous users see read-only view
- [ ] Records are displayed in a list or grid
- [ ] User can navigate to individual record detail pages
- [ ] Empty state is shown when collection has no records

### Technical Notes

- Endpoint should be accessible to both authenticated and anonymous users
- Include all collection fields in the response
- Include nested or related records in the response (or provide separate endpoint)
- Owner-specific actions should be conditionally rendered in the frontend
