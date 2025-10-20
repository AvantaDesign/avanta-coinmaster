# Phase 23: Digital Archive & Compliance

## Project Context

You are working on the Avanta Finance application, a comprehensive financial management system built with React, Vite, and Cloudflare Workers. The project is located at D:\AVANTA DESIGN CODE\avanta-coinmaster.

## Implementation Plan Reference

**CRITICAL:** Always refer to the master implementation plan at `IMPLEMENTATION_PLAN_V7.md` for complete project context and progress tracking. This file contains:

✅ **Phases 1-22: COMPLETED** (Comprehensive financial management system including):
- Phase 1-16: Core financial management, tax logic, and deductibility
- Phase 17: Income Module & Fiscal Foundations
- Phase 18: CFDI Control & Validation Module
- Phase 19: Core Tax Calculation Engine (ISR/IVA)
- Phase 20: Bank Reconciliation
- Phase 21: Advanced Declarations (DIOT & Contabilidad Electrónica)
- **Phase 22: Annual Declaration & Advanced Analytics** ✅ COMPLETED

🚧 **Phase 23: CURRENT PHASE** (Digital Archive & Compliance)

📋 **Phases 24-29:** Future phases

**IMPORTANT:** You must update the `IMPLEMENTATION_PLAN_V7.md` file with your progress as you complete each task.

---

## Current Task: Phase 23 - Digital Archive & Compliance

### Goal

Implement a secure digital document archive using Cloudflare R2 and create a proactive compliance alert system to help users maintain fiscal compliance and organize supporting documentation.

### Context from Previous Phases

Phase 22 successfully implemented:
- ✅ Annual ISR and IVA declaration generation
- ✅ Personal deductions management
- ✅ Comprehensive fiscal analytics dashboard
- ✅ Real-time compliance monitoring with scoring
- ✅ Tax optimization suggestions
- ✅ Complete integration with Phases 19-21

The system now needs:
1. **Document Storage**: Secure archive for CFDIs, contracts, receipts, and supporting documents
2. **Compliance Alerts**: Proactive notification system for fiscal calendar and validation rules
3. **Document Management**: Association between documents and transactions/declarations

---

## Actionable Steps

### 1. Database Schema - Document Archive & Compliance Alerts

**Create Migration:** `migrations/030_add_document_archive_compliance_alerts.sql`

#### Create `document_archive` table:
- `id` (PRIMARY KEY)
- `user_id` (INTEGER, foreign key to users)
- `document_type` (cfdi, contract, receipt, invoice, bank_statement, tax_declaration, other)
- `file_name` (TEXT)
- `file_path` (TEXT) - R2 object key
- `file_size` (INTEGER) - in bytes
- `mime_type` (TEXT) - e.g., application/pdf, image/jpeg
- `description` (TEXT)
- `upload_date` (DATE)
- `fiscal_year` (INTEGER)
- `fiscal_month` (INTEGER)
- `related_entity_type` (transaction, declaration, account, cfdi, other)
- `related_entity_id` (INTEGER)
- `metadata` (TEXT/JSON) - flexible storage for document-specific metadata
- `tags` (TEXT/JSON) - user-defined tags for organization
- `is_archived` (BOOLEAN, default 0)
- `created_at`, `updated_at`

#### Create `compliance_alerts` table:
- `id` (PRIMARY KEY)
- `user_id` (INTEGER, foreign key to users)
- `alert_type` (payment_deadline, cash_limit_exceeded, missing_cfdi, unreconciled_transaction, declaration_due, iva_threshold, isr_threshold, uncategorized_transaction, other)
- `severity` (info, warning, critical)
- `title` (TEXT)
- `message` (TEXT)
- `related_entity_type` (transaction, declaration, calculation, other)
- `related_entity_id` (INTEGER)
- `due_date` (DATE) - for deadline alerts
- `is_read` (BOOLEAN, default 0)
- `is_resolved` (BOOLEAN, default 0)
- `resolved_at` (TIMESTAMP)
- `alert_data` (TEXT/JSON) - additional alert-specific data
- `created_at`, `updated_at`

#### Create `fiscal_calendar` table:
- `id` (PRIMARY KEY)
- `event_type` (isr_payment, iva_payment, diot_submission, contabilidad_electronica, annual_declaration, informative_declaration)
- `event_name` (TEXT)
- `event_description` (TEXT)
- `month` (INTEGER, 1-12)
- `day` (INTEGER, 1-31)
- `deadline_type` (fixed, business_day, last_day_of_month, specific_date)
- `applies_to` (TEXT/JSON) - criteria for when this event applies (e.g., all users, users with income, etc.)
- `is_active` (BOOLEAN, default 1)
- `created_at`, `updated_at`

#### Create indexes:
- `idx_document_archive_user_type` on `document_archive(user_id, document_type)`
- `idx_document_archive_related` on `document_archive(related_entity_type, related_entity_id)`
- `idx_document_archive_fiscal_period` on `document_archive(fiscal_year, fiscal_month)`
- `idx_compliance_alerts_user` on `compliance_alerts(user_id, is_read, is_resolved)`
- `idx_compliance_alerts_type` on `compliance_alerts(alert_type, severity)`
- `idx_compliance_alerts_due_date` on `compliance_alerts(due_date)`
- `idx_fiscal_calendar_date` on `fiscal_calendar(month, day)`

#### Create views:
- `v_user_documents` - User documents with entity information
- `v_active_alerts` - Active (unresolved) alerts by user
- `v_upcoming_deadlines` - Upcoming fiscal calendar events
- `v_document_statistics` - Document counts and sizes by user

#### Create triggers:
- Update timestamp triggers for all tables
- Alert creation trigger when compliance issues detected

---

### 2. Cloudflare R2 Configuration

#### Update `wrangler.toml`:
Add R2 bucket binding for document storage:
```toml
[[r2_buckets]]
binding = "DOCUMENTS"
bucket_name = "avanta-finance-documents"
preview_bucket_name = "avanta-finance-documents-preview"
```

#### Create R2 Utilities:
**Create file:** `src/utils/r2Storage.js`
- `uploadDocument(file, metadata)` - Upload document to R2
- `downloadDocument(fileKey)` - Download document from R2
- `deleteDocument(fileKey)` - Delete document from R2
- `generateSignedUrl(fileKey, expiresIn)` - Generate temporary access URL
- `listDocuments(prefix)` - List documents in folder

---

### 3. Backend API Development

#### Create `functions/api/document-archive.js`:
**Endpoints:**
- `GET /api/document-archive` - List documents with filtering
  - Query params: type, fiscal_year, fiscal_month, related_entity_type, related_entity_id, tags, limit, offset
- `GET /api/document-archive/:id` - Get single document metadata
- `GET /api/document-archive/:id/download` - Generate signed URL for download
- `POST /api/document-archive/upload` - Upload document to R2 and save metadata
  - Handles multipart form data
  - Validates file type and size
  - Generates unique R2 key
  - Stores metadata in database
- `PUT /api/document-archive/:id` - Update document metadata
- `DELETE /api/document-archive/:id` - Delete document (soft delete or hard delete from R2)
- `POST /api/document-archive/:id/associate` - Associate document with entity
- `GET /api/document-archive/statistics` - Get document statistics

**Features:**
- File type validation (PDF, images, Excel, Word, XML)
- File size limits (configurable, e.g., 10MB per file)
- Virus scanning (optional, if available)
- Automatic thumbnail generation for images
- Metadata extraction from uploaded files
- Tag management

#### Create `functions/api/compliance-alerts.js`:
**Endpoints:**
- `GET /api/compliance-alerts` - List alerts with filtering
  - Query params: type, severity, is_read, is_resolved, limit, offset
- `GET /api/compliance-alerts/:id` - Get single alert
- `POST /api/compliance-alerts` - Create alert (admin/system)
- `PUT /api/compliance-alerts/:id/read` - Mark alert as read
- `PUT /api/compliance-alerts/:id/resolve` - Mark alert as resolved
- `DELETE /api/compliance-alerts/:id` - Delete alert
- `GET /api/compliance-alerts/summary` - Get alert summary (counts by type/severity)
- `POST /api/compliance-alerts/generate` - Generate alerts based on current data

**Alert Generation Logic:**
- **Payment Deadline Alerts**: Check fiscal calendar for upcoming deadlines
- **Cash Limit Alerts**: Detect transactions exceeding cash payment limits (e.g., >$5,000 MXN)
- **Missing CFDI Alerts**: Identify expenses >$2,000 without CFDI
- **Unreconciled Transaction Alerts**: Find transactions not matched with bank statements
- **Declaration Due Alerts**: Notify when monthly/annual declarations are pending
- **Threshold Alerts**: Notify when IVA or ISR balances exceed thresholds

#### Create `functions/api/fiscal-calendar.js`:
**Endpoints:**
- `GET /api/fiscal-calendar` - Get fiscal calendar events
- `GET /api/fiscal-calendar/upcoming` - Get upcoming events for current user
  - Query params: days_ahead (default: 30)
- `POST /api/fiscal-calendar` - Create calendar event (admin)
- `PUT /api/fiscal-calendar/:id` - Update calendar event (admin)
- `DELETE /api/fiscal-calendar/:id` - Delete calendar event (admin)

**Default Calendar Events (Pre-populate):**
- ISR/IVA monthly payment: 17th of following month
- DIOT submission: Last day of following month
- Contabilidad Electrónica: Varies by period
- Annual ISR declaration: April 30th
- Informative declarations: Various dates

---

### 4. Frontend UI - Document Archive & Compliance

#### Create `src/components/DocumentArchive.jsx`:
**Features:**
- **Four-tab layout:** Documents, Upload, Associated, Statistics
- **Documents Tab:**
  - List view with thumbnails for images
  - Filters: type, year, month, tags
  - Search by filename or description
  - Columns: Thumbnail, Name, Type, Size, Upload Date, Related To, Tags, Actions
  - Actions: View, Download, Edit, Delete, Associate
  - Pagination
  - Drag & drop upload area (always visible)
- **Upload Tab:**
  - File upload interface (drag & drop or browse)
  - Multiple file upload support
  - Document type selector
  - Fiscal period selector (year/month)
  - Description field
  - Tags input (multiple tags)
  - Associate with entity (transaction, declaration, etc.)
  - Upload progress indicators
  - Preview before upload
- **Associated Tab:**
  - View documents associated with specific entities
  - Entity selector (transactions, declarations, accounts, CFDIs)
  - Quick association interface
  - Bulk association tools
- **Statistics Tab:**
  - Total documents count
  - Storage used (MB/GB)
  - Document distribution by type (pie chart)
  - Upload history timeline
  - Most used tags
  - Document organization tips

**Document Types:**
- CFDI (Factura)
- Contrato (Contract)
- Recibo (Receipt)
- Estado de Cuenta (Bank Statement)
- Declaración Fiscal (Tax Declaration)
- Comprobante (Proof of Payment)
- Otro (Other)

**File Type Support:**
- PDF (primary)
- Images: JPG, PNG, GIF
- Documents: XLSX, DOCX
- XML (for CFDI)

#### Create `src/components/ComplianceAlerts.jsx`:
**Features:**
- **Dashboard view with alert cards**
- **Three sections:** Active Alerts, Resolved Alerts, Fiscal Calendar
- **Active Alerts Section:**
  - Alert cards with severity indicators
  - Priority sorting (critical → warning → info)
  - Alert details: title, message, due date, related entity
  - Actions: Mark as Read, Resolve, View Related Item
  - Quick filters: All, Critical, Warning, Info
  - Unread count badge
- **Resolved Alerts Section:**
  - History of resolved alerts
  - Resolution date and notes
  - Filter by date range
  - Search functionality
- **Fiscal Calendar Section:**
  - Upcoming fiscal events (next 30 days)
  - Event cards with date, title, description
  - Days remaining indicator
  - Link to relevant module (e.g., tax calculations, declarations)
  - Calendar view option (month grid)
- **Alert Types Displayed:**
  - Payment deadlines (red icon, calendar)
  - Cash limit exceeded (yellow icon, warning)
  - Missing CFDI (orange icon, document)
  - Unreconciled transactions (blue icon, bank)
  - Declaration due (purple icon, file)
  - Threshold exceeded (red icon, chart)

**Alert Card Design:**
```
┌─────────────────────────────────────────┐
│ [Icon] [Severity Badge]                 │
│ Alert Title                        [×]  │
│ Alert message description...            │
│                                          │
│ Due: [Date]  Related: [Link]           │
│                                          │
│ [Mark as Read] [Resolve] [View Details]│
└─────────────────────────────────────────┘
```

#### Update `src/components/NotificationCenter.jsx`:
- Add integration with compliance alerts
- Show latest alerts in notification dropdown
- Badge count for unread alerts
- Link to full Compliance Alerts page

---

### 5. Integration & Business Logic

#### Document-Transaction Association:
- When uploading CFDI, auto-link to transaction by UUID
- Allow manual association of documents to transactions
- Show associated documents in transaction details view
- Bulk association tools for multiple documents

#### Document-Declaration Association:
- Link supporting documents to declarations
- Show documents used for declaration in declaration details
- Require documents for certain declaration types

#### Alert Generation Automation:
- Daily cron job (Cloudflare Worker cron trigger) to check:
  - Upcoming payment deadlines (7 days, 3 days, 1 day, due date)
  - Missing CFDIs on recent transactions
  - Unreconciled transactions older than 30 days
  - Unsigned bank statements older than 30 days
  - Uncategorized transactions
- Real-time alerts on user actions:
  - Cash payment exceeds limit on transaction creation
  - IVA threshold exceeded
  - ISR threshold exceeded

#### Compliance Score Integration:
- Update Phase 22 Fiscal Analytics compliance score to include:
  - Document completeness (transactions with supporting docs)
  - Alert resolution rate
  - Proactive compliance (resolved before due date)

---

### 6. Verification Steps

**Functional Testing:**
1. ✅ Upload various document types (PDF, images, Excel)
2. ✅ Download documents and verify integrity
3. ✅ Associate documents with transactions
4. ✅ Associate documents with declarations
5. ✅ Generate compliance alerts
6. ✅ Mark alerts as read/resolved
7. ✅ View fiscal calendar events
8. ✅ Test document search and filtering
9. ✅ Test document deletion (soft and hard)
10. ✅ Verify R2 storage limits

**Integration Testing:**
1. ✅ Upload CFDI and auto-link to transaction
2. ✅ Generate declaration and attach supporting documents
3. ✅ Check compliance score with/without documents
4. ✅ Test alert generation on transaction creation
5. ✅ Verify fiscal calendar integration with declarations

**Security Testing:**
1. ✅ Verify file upload validation (type, size)
2. ✅ Test signed URL expiration
3. ✅ Ensure users can only access their own documents
4. ✅ Validate document metadata updates
5. ✅ Test deletion permissions

**UI/UX Testing:**
1. ✅ Test drag & drop file upload
2. ✅ Verify responsive design on mobile/tablet
3. ✅ Test dark mode compatibility
4. ✅ Verify loading states during uploads
5. ✅ Test error messages for failed uploads
6. ✅ Confirm navigation flow
7. ✅ Test alert interactions (read, resolve, dismiss)

**Performance Testing:**
1. ✅ Test upload performance with large files
2. ✅ Test download speed for signed URLs
3. ✅ Verify pagination performance with many documents
4. ✅ Test alert generation performance
5. ✅ Monitor R2 API call limits

---

### 7. Progress Tracking

**MANDATORY:** Update `IMPLEMENTATION_PLAN_V7.md` with checkmarks (✅) as you complete each task.

**MANDATORY:** Create a completion summary document `PHASE_23_DIGITAL_ARCHIVE_SUMMARY.md` when finished.

**Commit your changes** with descriptive messages throughout the implementation.

**Mark Phase 23 as completed** when all tasks are done.

---

## Technical Considerations

### Cloudflare R2 Best Practices:
- Use consistent key naming conventions (e.g., `users/{userId}/documents/{year}/{month}/{filename}`)
- Implement multipart uploads for large files
- Set appropriate cache headers for downloads
- Use signed URLs with reasonable expiration times (1 hour default)
- Implement proper error handling for R2 operations
- Consider storage quotas per user

### File Upload Security:
- Validate MIME types on both frontend and backend
- Scan for malicious content (if tooling available)
- Limit file sizes (10MB default, configurable)
- Sanitize filenames to prevent path traversal
- Generate unique keys to prevent collisions
- Store checksums for integrity verification

### Alert System Design:
- Implement rate limiting for alert generation
- Avoid duplicate alerts (check existing alerts before creating)
- Use batch processing for alert generation
- Implement alert expiration (auto-resolve after deadline passes)
- Allow users to configure alert preferences
- Send email notifications for critical alerts (optional)

### Performance Optimization:
- Use pagination for document listings
- Implement lazy loading for document thumbnails
- Cache fiscal calendar events
- Optimize database queries with proper indexes
- Use connection pooling for R2 operations

### Mexican Fiscal Compliance:
- **Cash Payment Limit**: Alert when transaction exceeds $5,000 MXN in cash
- **CFDI Requirement**: Alert for expenses >$2,000 without CFDI
- **Payment Deadlines**: ISR/IVA payment by 17th of following month
- **DIOT Deadline**: Last day of following month
- **Annual Declaration**: April 30th for individuals
- **Document Retention**: Keep documents for 5 years (SAT requirement)

---

## Database Considerations

### Storage Considerations:
- Estimate storage needs: Average 10MB per document × 100 documents per user = 1GB per user
- Implement storage quotas per user tier
- Monitor R2 costs and optimize as needed
- Implement document archival strategy (move old docs to cheaper storage)

### Data Integrity:
- Foreign key constraints for related entities
- Cascading deletes where appropriate
- Transaction support for complex operations
- Regular backups of metadata database
- Separate R2 backups if needed

### Indexing Strategy:
- Index frequently queried fields (user_id, document_type, fiscal_year)
- Composite indexes for common filter combinations
- Avoid over-indexing to maintain write performance

---

## Integration Points

### Phase 18 (CFDI Manager):
- Auto-upload CFDI XML files to document archive
- Link uploaded CFDIs to transactions
- Show associated documents in CFDI manager

### Phase 19 (Tax Calculations):
- Generate alerts for unpaid tax calculations
- Link tax calculation reports to document archive
- Show compliance status in tax calculations

### Phase 20 (Bank Reconciliation):
- Upload bank statements to document archive
- Link reconciled transactions to bank statements
- Alert on unreconciled transactions

### Phase 21 (SAT Declarations):
- Archive generated XML files
- Link supporting documents to declarations
- Alert on declaration deadlines

### Phase 22 (Annual Declarations):
- Link personal deduction documents to annual declaration
- Archive annual declaration PDFs
- Show document completeness in analytics

---

## Security Considerations

### Access Control:
- Users can only access their own documents
- Implement role-based access (admin, user)
- Audit logging for sensitive operations
- Secure API endpoints with authentication

### Data Privacy:
- Encrypt sensitive document metadata
- Use secure HTTPS for all file transfers
- Implement data retention policies
- GDPR/privacy compliance considerations

### File Security:
- Virus scanning on upload (if available)
- Validate file integrity with checksums
- Prevent directory traversal attacks
- Sanitize user inputs

---

## User Experience Highlights

### Document Upload Flow:
1. User drags file or clicks to browse
2. Preview shows file details
3. User fills in metadata (type, period, description, tags)
4. User can associate with entity (optional)
5. Progress bar shows upload status
6. Success message with view/download options

### Alert Interaction Flow:
1. User sees notification badge
2. Clicks to view alert details
3. Reviews alert message and related entity
4. Takes action (resolve, view related item, dismiss)
5. Alert moves to resolved section
6. User tracks compliance improvements

### Calendar Integration:
1. User views upcoming fiscal events
2. Clicks event to see details
3. Sets reminders (optional)
4. Links to relevant module to complete action
5. Tracks compliance with deadlines

---

## Success Metrics

### Feature Completeness:
- [ ] Document upload/download functionality
- [ ] R2 integration working
- [ ] Document-entity associations
- [ ] Compliance alert generation
- [ ] Fiscal calendar implementation
- [ ] Alert resolution workflow
- [ ] Search and filtering
- [ ] Statistics and reporting

### Integration:
- [ ] CFDI auto-upload integration
- [ ] Transaction document links
- [ ] Declaration document links
- [ ] Compliance score updates
- [ ] Notification center integration

### Quality:
- [ ] Build succeeds without errors
- [ ] All tests passing
- [ ] Responsive design verified
- [ ] Dark mode compatibility
- [ ] Security measures in place
- [ ] Performance benchmarks met

---

## Next Step

Upon successful completion and verification of all Phase 23 tasks, generate and output the complete, self-contained prompt for **Phase 24: System-Wide Verification & Documentation**, following this same instructional format and referencing the updated implementation plan.

---

## Resources

### Cloudflare R2 Documentation:
- https://developers.cloudflare.com/r2/
- https://developers.cloudflare.com/r2/api/workers/workers-api-usage/

### Cloudflare Workers Cron Triggers:
- https://developers.cloudflare.com/workers/configuration/cron-triggers/

### File Upload Best Practices:
- https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications

### Mexican Fiscal Calendar:
- SAT official calendar: https://www.sat.gob.mx/
- Payment deadlines: Refer to current SAT regulations

---

**Remember:** This is a critical phase that adds essential document management and compliance monitoring capabilities to the Avanta Finance system. Follow the implementation plan carefully, test thoroughly, and ensure seamless integration with all previous phases.

**Status:** READY TO IMPLEMENT 🚀
