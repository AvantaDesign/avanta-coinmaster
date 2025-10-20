# Phase 35: Centralized Settings Panel - Implementation Guide

**Version:** 1.0  
**Date:** January 2025  
**Author:** Avanta Finance Development Team

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [API Reference](#api-reference)
6. [Testing Guide](#testing-guide)
7. [Deployment Steps](#deployment-steps)

---

## Overview

Phase 35 implements a centralized settings panel that unifies all user preferences, fiscal configuration, and system settings into a single, organized interface. This guide provides detailed technical information for developers working with or extending the settings system.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Settings.jsx (Main Page)                  │  │
│  │  ┌────────┬────────┬────────┬────────┬────────┐    │  │
│  │  │Profile │ Fiscal │Accounts│Category│Security│    │  │
│  │  │  Tab   │  Tab   │  Tab   │  Tab   │  Tab   │    │  │
│  │  └────────┴────────┴────────┴────────┴────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ API Calls
┌───────────────────────▼─────────────────────────────────────┐
│              Cloudflare Workers Functions                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  settings.js          fiscal-certificates.js        │  │
│  │  - GET /settings      - GET /certificates           │  │
│  │  - PUT /settings      - POST /certificates          │  │
│  │  - POST /reset        - DELETE /certificates/:id    │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ Database & Storage
┌───────────────────────▼─────────────────────────────────────┐
│              Cloudflare D1 + R2 Storage                      │
│  ┌──────────────────┐      ┌──────────────────────────┐    │
│  │ user_settings    │      │ R2: Certificate Files     │    │
│  │ fiscal_certs     │      │ Path: fiscal-certs/{user} │    │
│  └──────────────────┘      └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Migration 039: Settings Tables

**File:** `migrations/039_add_settings_tables.sql`

#### User Settings Table

Stores user preferences as key-value pairs with JSON support.

```sql
CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT NOT NULL, -- JSON string for complex values
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, setting_key)
);

-- Indexes
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_settings_key ON user_settings(setting_key);

-- Trigger for timestamp updates
CREATE TRIGGER update_user_settings_timestamp 
AFTER UPDATE ON user_settings
BEGIN
    UPDATE user_settings 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;
```

**Usage Example:**
```javascript
// Store a simple value
INSERT INTO user_settings (user_id, setting_key, setting_value)
VALUES ('user123', 'theme', 'dark');

// Store a complex value (JSON)
INSERT INTO user_settings (user_id, setting_key, setting_value)
VALUES ('user123', 'dashboard_layout', '{"columns": 2, "widgets": [...]}');
```

#### Fiscal Certificates Table

Stores uploaded fiscal certificates with OCR analysis results.

```sql
CREATE TABLE IF NOT EXISTS fiscal_certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in R2 storage
    file_size INTEGER,
    mime_type TEXT,
    analysis_data TEXT, -- JSON from OCR
    certificate_type TEXT DEFAULT 'situacion_fiscal',
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    processed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_fiscal_certificates_user_id ON fiscal_certificates(user_id);
CREATE INDEX idx_fiscal_certificates_status ON fiscal_certificates(status);
CREATE INDEX idx_fiscal_certificates_type ON fiscal_certificates(certificate_type);
```

---

## Backend Implementation

### Settings API (`functions/api/settings.js`)

#### Default Settings Structure

```javascript
const DEFAULT_SETTINGS = {
  theme: 'system',              // 'light' | 'dark' | 'system'
  language: 'es',               // 'es' | 'en'
  currency: 'MXN',              // 'MXN' | 'USD' | 'EUR'
  date_format: 'DD/MM/YYYY',    // Format string
  time_format: '24h',           // '12h' | '24h'
  notifications_enabled: true,
  email_notifications: true,
  fiscal_regime: '',            // User's fiscal regime
  tax_residence: 'MX',          // Country code
  decimal_separator: '.',
  thousands_separator: ',',
  dashboard_layout: 'default'
};
```

#### Setting Validation Rules

```javascript
const SETTING_VALIDATIONS = {
  theme: { type: 'enum', values: ['light', 'dark', 'system'] },
  language: { type: 'enum', values: ['es', 'en'] },
  currency: { type: 'enum', values: ['MXN', 'USD', 'EUR'] },
  date_format: { type: 'enum', values: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] },
  time_format: { type: 'enum', values: ['12h', '24h'] },
  notifications_enabled: { type: 'boolean' },
  email_notifications: { type: 'boolean' },
  fiscal_regime: { type: 'string' },
  tax_residence: { type: 'string' },
  decimal_separator: { type: 'enum', values: ['.', ','] },
  thousands_separator: { type: 'enum', values: ['.', ',', ' ', ''] },
  dashboard_layout: { type: 'string' }
};
```

#### Setting Categories

Settings are organized into logical categories for UI presentation:

```javascript
const SETTING_CATEGORIES = {
  appearance: {
    name: 'Apariencia',
    description: 'Personaliza el aspecto de la aplicación',
    settings: ['theme', 'language']
  },
  regional: {
    name: 'Regional',
    description: 'Configuración regional y de formato',
    settings: ['currency', 'date_format', 'time_format', 'decimal_separator', 'thousands_separator']
  },
  notifications: {
    name: 'Notificaciones',
    settings: ['notifications_enabled', 'email_notifications']
  },
  fiscal: {
    name: 'Fiscal',
    settings: ['fiscal_regime', 'tax_residence']
  }
};
```

### Fiscal Certificates API (`functions/api/fiscal-certificates.js`)

#### File Upload Handling

```javascript
// Validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf'
];

// Storage path structure
const storagePath = `fiscal-certificates/${userId}/${timestamp}.${extension}`;

// Upload to R2
await env.R2_BUCKET.put(storagePath, arrayBuffer, {
  httpMetadata: { contentType: file.type }
});
```

#### OCR Analysis Integration

```javascript
// Current: Mock implementation
async function performOCRAnalysis(file, certificateType, env) {
  return {
    extracted: true,
    certificateType,
    data: {
      rfc: '',
      nombre: '',
      regimen_fiscal: '',
      domicilio_fiscal: '',
      // ... more fields
    },
    confidence: 0.0,
    processedAt: new Date().toISOString()
  };
}

// Future: Real OCR integration
// Call to functions/api/process-document-ocr.js
// Or external service (Google Cloud Vision, AWS Textract, etc.)
```

---

## Frontend Implementation

### Main Settings Page (`src/pages/Settings.jsx`)

#### Component Structure

```jsx
export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Tab configuration
  const TABS = [
    { id: 'profile', name: 'Perfil', icon: '👤', component: ProfileTab },
    { id: 'fiscal', name: 'Fiscal', icon: '📄', component: FiscalTab },
    // ... more tabs
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Tab Navigation */}
      {/* Active Tab Content */}
    </div>
  );
}
```

#### State Management

```javascript
// Loading settings
const loadSettings = async () => {
  const response = await fetch('/api/settings', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  const data = await response.json();
  setSettings(data.settings);
};

// Updating settings
const updateSettings = async (newSettings) => {
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ settings: newSettings })
  });
  // Handle response...
};
```

### Tab Components

Each tab component receives props from the parent:

```jsx
function ProfileTab({ settings, updateSettings, user }) {
  const [formData, setFormData] = useState({
    theme: settings?.theme || 'system',
    language: settings?.language || 'es',
    // ... more settings
  });

  const handleSave = async () => {
    await updateSettings(formData);
  };

  return (
    // Tab content...
  );
}
```

---

## API Reference

### Settings Endpoints

#### GET /api/settings

Get all settings for the authenticated user.

**Request:**
```http
GET /api/settings
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "theme": "dark",
    "language": "es",
    "currency": "MXN",
    // ... all settings with defaults
  },
  "categories": {
    "appearance": { /* ... */ },
    // ... category definitions
  }
}
```

#### PUT /api/settings

Update one or more settings.

**Request:**
```http
PUT /api/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "settings": {
    "theme": "dark",
    "language": "en"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuración actualizada exitosamente",
  "updated": {
    "theme": "dark",
    "language": "en"
  }
}
```

#### POST /api/settings/reset

Reset all settings to defaults.

**Request:**
```http
POST /api/settings/reset
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuración restablecida a valores predeterminados",
  "settings": { /* default settings */ }
}
```

### Fiscal Certificates Endpoints

#### GET /api/fiscal-certificates

List all certificates for user.

**Response:**
```json
{
  "success": true,
  "certificates": [
    {
      "id": 1,
      "filename": "constancia_2025.pdf",
      "file_size": 1024000,
      "status": "completed",
      "uploaded_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

#### POST /api/fiscal-certificates

Upload a new certificate.

**Request:**
```http
POST /api/fiscal-certificates
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: (binary)
type: situacion_fiscal
```

**Response:**
```json
{
  "success": true,
  "message": "Certificado subido exitosamente",
  "certificate": {
    "id": 1,
    "filename": "constancia_2025.pdf",
    "status": "completed",
    "analysis_data": { /* OCR results */ }
  }
}
```

#### GET /api/fiscal-certificates/:id

Get certificate details.

#### DELETE /api/fiscal-certificates/:id

Delete a certificate.

---

## Testing Guide

### Manual Testing Checklist

**Settings Tab:**
- [ ] Change theme and verify UI updates
- [ ] Change language setting
- [ ] Modify regional settings
- [ ] Save settings and reload page
- [ ] Verify settings persist
- [ ] Reset to defaults

**Fiscal Tab:**
- [ ] Upload PDF certificate
- [ ] Upload JPG/PNG image
- [ ] Try uploading invalid file type
- [ ] Try uploading file > 10MB
- [ ] View certificate details
- [ ] Delete certificate
- [ ] Verify R2 cleanup

**Security Tab:**
- [ ] Toggle notification settings
- [ ] Test password form validation
- [ ] Verify settings save

**Navigation:**
- [ ] Test all tab switches
- [ ] Test mobile dropdown selector
- [ ] Verify links to other pages work

### API Testing

```bash
# Get settings
curl -H "Authorization: Bearer {token}" \
  https://your-domain.com/api/settings

# Update settings
curl -X PUT \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"settings":{"theme":"dark"}}' \
  https://your-domain.com/api/settings

# Upload certificate
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -F "file=@certificate.pdf" \
  -F "type=situacion_fiscal" \
  https://your-domain.com/api/fiscal-certificates
```

---

## Deployment Steps

### 1. Database Migration

```bash
# Apply migration to preview database
wrangler d1 execute avanta-coinmaster-preview \
  --file=migrations/039_add_settings_tables.sql

# Apply migration to production database
wrangler d1 execute avanta-coinmaster \
  --file=migrations/039_add_settings_tables.sql
```

### 2. Deploy Functions

```bash
# Build frontend
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

### 3. Verify Deployment

- [ ] Check migration applied successfully
- [ ] Test settings API endpoints
- [ ] Test fiscal certificates upload
- [ ] Verify R2 storage working
- [ ] Test UI in production

### 4. Monitor

- Watch error logs for API failures
- Monitor R2 storage usage
- Check database query performance
- Verify user data isolation

---

## Troubleshooting

### Common Issues

**Settings not persisting:**
- Check database connection
- Verify user authentication
- Check browser localStorage

**File upload failing:**
- Verify R2 bucket configured
- Check file size limits
- Verify MIME type validation

**OCR not working:**
- Currently using mock implementation
- Future: Configure OCR service credentials

---

## Extension Guide

### Adding New Settings

1. **Add to DEFAULT_SETTINGS**
```javascript
const DEFAULT_SETTINGS = {
  // ... existing
  new_setting: 'default_value'
};
```

2. **Add Validation Rule**
```javascript
const SETTING_VALIDATIONS = {
  // ... existing
  new_setting: { type: 'enum', values: ['option1', 'option2'] }
};
```

3. **Add to Category**
```javascript
const SETTING_CATEGORIES = {
  category_name: {
    settings: [..., 'new_setting']
  }
};
```

4. **Update UI Component**
```jsx
// Add form field in appropriate tab
<select value={formData.new_setting} ...>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>
```

### Adding New Tab

1. **Create Component**
```jsx
// src/components/settings/NewTab.jsx
export default function NewTab({ settings, updateSettings }) {
  return <div>...</div>;
}
```

2. **Add to TABS Array**
```javascript
const TABS = [
  // ... existing
  { id: 'newtab', name: 'New Tab', icon: '🆕', component: NewTab }
];
```

---

## Performance Optimization

### Database Indexes
- User ID indexed for fast user lookups
- Setting key indexed for fast key lookups
- Certificate status indexed for filtering

### Frontend Caching
- Settings loaded once on mount
- Local state updates for instant feedback
- Optimistic UI updates

### File Upload
- Client-side validation before upload
- Progress indication for large files
- Background processing for OCR

---

## Security Considerations

### Authentication
- All endpoints require valid JWT token
- Token verified on every request
- User ID extracted from token

### Authorization
- Users can only access their own settings
- Users can only access their own certificates
- Foreign key constraints prevent cross-user access

### Input Validation
- Setting values validated by type
- File types restricted
- File sizes limited
- SQL injection prevented by prepared statements

### Data Privacy
- Settings stored per-user
- Certificates isolated per-user
- R2 paths include user ID
- No cross-user data leakage

---

## Conclusion

This implementation provides a solid foundation for centralized settings management in Avanta Finance. The modular design allows for easy extension with new settings and features while maintaining security and user data isolation.

For questions or issues, refer to the project documentation or contact the development team.
