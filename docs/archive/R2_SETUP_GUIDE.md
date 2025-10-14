# R2 Storage Setup Guide - Avanta Finance

## Overview

This guide walks you through setting up Cloudflare R2 storage for file uploads in Avanta Finance. R2 is used to store receipts, invoices (XML files), and other financial documents.

## Table of Contents

1. [What is R2?](#what-is-r2)
2. [Prerequisites](#prerequisites)
3. [Creating R2 Bucket](#creating-r2-bucket)
4. [Configuring wrangler.toml](#configuring-wranglertoml)
5. [Testing R2 Connection](#testing-r2-connection)
6. [Local Development](#local-development)
7. [Production Deployment](#production-deployment)
8. [Allowed File Types](#allowed-file-types)
9. [File Size Limits](#file-size-limits)
10. [Security Features](#security-features)
11. [Troubleshooting](#troubleshooting)
12. [API Reference](#api-reference)

---

## What is R2?

Cloudflare R2 is an S3-compatible object storage service that offers:
- **Zero egress fees** (free data transfer out)
- **High performance** (global edge network)
- **Low cost** ($0.015/GB storage per month)
- **Free tier** (10 GB storage, 10M reads/month, 1M writes/month)

In Avanta Finance, R2 stores:
- Receipt images (JPEG, PNG, GIF)
- Invoice XML files (CFDI)
- PDF documents
- Other financial documents

---

## Prerequisites

Before setting up R2, ensure you have:

1. **Cloudflare account** (free tier is sufficient)
2. **Wrangler CLI installed**:
   ```bash
   npm install -g wrangler
   ```
3. **Authenticated with Cloudflare**:
   ```bash
   wrangler login
   ```

---

## Creating R2 Bucket

### Step 1: Create the Bucket

Run the following command to create an R2 bucket:

```bash
wrangler r2 bucket create avanta-receipts
```

**Expected output:**
```
✅ Created bucket 'avanta-receipts' with default storage class set to Standard.
```

### Step 2: Verify Bucket Creation

List all R2 buckets to confirm:

```bash
wrangler r2 bucket list
```

**Expected output:**
```
┌───────────────────┬──────────────────────────┐
│ Name              │ Created                  │
├───────────────────┼──────────────────────────┤
│ avanta-receipts   │ 2025-01-15T10:30:00.000Z │
└───────────────────┴──────────────────────────┘
```

---

## Configuring wrangler.toml

The `wrangler.toml` file should already have the R2 binding configured:

```toml
[[r2_buckets]]
binding = "RECEIPTS"
bucket_name = "avanta-receipts"
```

**Configuration details:**
- `binding`: The variable name used in Workers code (`env.RECEIPTS`)
- `bucket_name`: The name of your R2 bucket (must match the created bucket)

---

## Testing R2 Connection

### Test 1: List Bucket Contents

```bash
wrangler r2 object list avanta-receipts
```

**Expected output (empty bucket):**
```
No objects found in bucket 'avanta-receipts'
```

### Test 2: Upload Test File

Create a test file and upload it:

```bash
echo "Test file" > test.txt
wrangler r2 object put avanta-receipts/test.txt --file=test.txt
```

### Test 3: Verify Upload

```bash
wrangler r2 object list avanta-receipts
```

**Expected output:**
```
┌──────────┬───────────┬──────────────────────────┐
│ Key      │ Size      │ Last Modified            │
├──────────┼───────────┼──────────────────────────┤
│ test.txt │ 10 bytes  │ 2025-01-15T10:35:00.000Z │
└──────────┴───────────┴──────────────────────────┘
```

### Test 4: Download Test File

```bash
wrangler r2 object get avanta-receipts/test.txt --file=downloaded.txt
cat downloaded.txt
```

### Test 5: Delete Test File

```bash
wrangler r2 object delete avanta-receipts/test.txt
```

---

## Local Development

### Start Development Server with R2

To test file uploads locally, run:

```bash
# Build the application
npm run build

# Start Wrangler dev server with R2 binding
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788
```

**The server will be available at:** `http://localhost:8788`

### Test Upload API

```bash
# Create a test image
convert -size 100x100 xc:blue test.png

# Upload the file
curl -X POST http://localhost:8788/api/upload \
  -F "file=@test.png"
```

**Expected response:**
```json
{
  "success": true,
  "url": "/api/upload/1234567890-test.png",
  "filename": "1234567890-test.png",
  "originalName": "test.png",
  "size": 12345,
  "sizeMB": 0.01,
  "type": "image/png",
  "metadata": {
    "icon": "🖼️",
    "category": "image",
    "extension": ".png"
  },
  "uploadedAt": "2025-01-15T10:40:00.000Z",
  "uploadDurationMs": 123,
  "message": "File uploaded successfully"
}
```

---

## Production Deployment

### Step 1: Build Application

```bash
npm run build
```

### Step 2: Deploy to Cloudflare Pages

```bash
wrangler pages deploy dist
```

### Step 3: Configure Bindings in Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → Your project
3. Go to **Settings** → **Functions** → **Bindings**
4. Add R2 bucket binding:
   - Variable name: `RECEIPTS`
   - R2 bucket: Select `avanta-receipts`
5. Click **Save**

### Step 4: Verify Deployment

Visit your deployed URL and test the file upload:

1. Go to **Invoices** page
2. Click **Agregar Factura**
3. Drag and drop an XML or PDF file
4. Verify successful upload

---

## Allowed File Types

The upload API accepts the following file types:

| Type | MIME Type | Icon | Max Size |
|------|-----------|------|----------|
| JPEG | `image/jpeg` | 🖼️ | 10 MB |
| PNG | `image/png` | 🖼️ | 10 MB |
| GIF | `image/gif` | 🖼️ | 10 MB |
| PDF | `application/pdf` | 📄 | 10 MB |
| XML | `text/xml` | 📋 | 10 MB |
| XML | `application/xml` | 📋 | 10 MB |

### Adding New File Types

To add support for new file types, update the `ALLOWED_TYPES` object in:
- `functions/api/upload.js`
- `src/components/FileUpload.jsx`

Example:
```javascript
const ALLOWED_TYPES = {
  // ... existing types
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    extension: '.xlsx',
    icon: '📊',
    category: 'document'
  }
};
```

---

## File Size Limits

**Maximum file size:** 10 MB (10,485,760 bytes)

This limit is enforced in:
1. **Backend API** (`functions/api/upload.js`)
2. **Frontend validation** (`src/components/FileUpload.jsx`)

### Changing the Size Limit

To change the maximum file size:

1. Update `MAX_FILE_SIZE` in `functions/api/upload.js`:
   ```javascript
   const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
   ```

2. Update `MAX_FILE_SIZE` in `src/components/FileUpload.jsx`:
   ```javascript
   const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
   ```

3. Consider R2 free tier limits:
   - **Storage:** 10 GB total
   - **Writes:** 1 million per month

---

## Security Features

### 1. File Type Validation

- **Server-side validation** of MIME types
- **Client-side validation** for better UX
- Only whitelisted file types are accepted

### 2. Filename Sanitization

All uploaded filenames are sanitized:
- Special characters removed or replaced with `_`
- Timestamp prefix added for uniqueness
- Example: `test file!@#.png` → `1234567890-test_file___.png`

### 3. File Size Validation

- **Server-side validation** prevents oversized uploads
- **Client-side validation** provides immediate feedback
- Returns detailed error messages

### 4. CORS Configuration

CORS headers allow cross-origin requests while maintaining security:
```javascript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
'Access-Control-Allow-Headers': 'Content-Type'
```

### 5. Error Codes

All errors include machine-readable codes:
- `R2_NOT_CONFIGURED`: R2 binding missing
- `FILE_REQUIRED`: No file in request
- `INVALID_FILE_TYPE`: Unsupported file type
- `FILE_TOO_LARGE`: File exceeds size limit
- `STORAGE_ERROR`: R2 upload failed
- `FILE_NOT_FOUND`: Download of non-existent file

---

## Troubleshooting

### Problem: "Storage not available" error

**Cause:** R2 binding not configured

**Solution:**
1. Verify bucket exists:
   ```bash
   wrangler r2 bucket list
   ```
2. Check `wrangler.toml` has correct binding:
   ```toml
   [[r2_buckets]]
   binding = "RECEIPTS"
   bucket_name = "avanta-receipts"
   ```
3. For production, verify bindings in Cloudflare Dashboard

### Problem: "File not found" when downloading

**Cause:** File doesn't exist in R2 or incorrect filename

**Solution:**
1. List bucket contents:
   ```bash
   wrangler r2 object list avanta-receipts
   ```
2. Verify the filename matches exactly
3. Check upload was successful

### Problem: Upload fails with no error

**Cause:** Network timeout or R2 rate limit

**Solution:**
1. Check R2 free tier limits (1M writes/month)
2. Verify network connectivity
3. Check Cloudflare status page
4. Review browser console for errors

### Problem: CORS errors in browser

**Cause:** Missing or incorrect CORS headers

**Solution:**
1. Verify `onRequestOptions` handler exists in `upload.js`
2. Check CORS headers include `Access-Control-Allow-Origin`
3. For production, verify deployment includes latest code

### Problem: File upload times out

**Cause:** File too large or slow connection

**Solution:**
1. Reduce file size (compress images, optimize PDFs)
2. Check file doesn't exceed 10 MB limit
3. Test with smaller file to isolate issue

---

## API Reference

### POST /api/upload

Upload a file to R2 storage.

**Request:**
```
POST /api/upload
Content-Type: multipart/form-data

file: <binary data>
```

**Success Response (201):**
```json
{
  "success": true,
  "url": "/api/upload/1234567890-filename.png",
  "filename": "1234567890-filename.png",
  "originalName": "filename.png",
  "size": 12345,
  "sizeMB": 0.01,
  "type": "image/png",
  "metadata": {
    "icon": "🖼️",
    "category": "image",
    "extension": ".png"
  },
  "uploadedAt": "2025-01-15T10:40:00.000Z",
  "uploadDurationMs": 123,
  "message": "File uploaded successfully"
}
```

**Error Response (400 - Invalid File Type):**
```json
{
  "error": "Invalid file type",
  "details": "File type \"text/plain\" is not allowed",
  "allowed": ["image/jpeg", "image/png", ...],
  "received": "text/plain",
  "code": "INVALID_FILE_TYPE"
}
```

**Error Response (413 - File Too Large):**
```json
{
  "error": "File too large",
  "details": "File size 15.5 MB exceeds maximum of 10 MB",
  "maxSize": 10485760,
  "maxSizeMB": 10,
  "received": 16252928,
  "receivedMB": 15.5,
  "code": "FILE_TOO_LARGE"
}
```

### GET /api/upload/:filename

Download a file from R2 storage.

**Request:**
```
GET /api/upload/1234567890-filename.png
```

**Success Response (200):**
```
Content-Type: image/png
Content-Length: 12345
Content-Disposition: inline; filename="1234567890-filename.png"
Cache-Control: public, max-age=31536000

<binary data>
```

**Error Response (404 - File Not Found):**
```json
{
  "error": "File not found",
  "details": "The file \"1234567890-filename.png\" does not exist",
  "filename": "1234567890-filename.png",
  "code": "FILE_NOT_FOUND"
}
```

### OPTIONS /api/upload

CORS preflight request.

**Request:**
```
OPTIONS /api/upload
Origin: http://example.com
Access-Control-Request-Method: POST
```

**Response (204):**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## Testing

Run the comprehensive R2 test suite:

```bash
# Test local development
./test-r2-upload.sh http://localhost:8788

# Test production
./test-r2-upload.sh https://your-project.pages.dev
```

The test script validates:
- ✅ CORS preflight requests
- ✅ Valid file uploads (PNG, JPEG, PDF, XML)
- ✅ Invalid file type rejection
- ✅ File size limit enforcement
- ✅ Filename sanitization
- ✅ Response format validation
- ✅ File download functionality
- ✅ Error handling

---

## Cost Estimation

### Free Tier Limits

- **Storage:** 10 GB
- **Class A Operations (writes):** 1 million/month
- **Class B Operations (reads):** 10 million/month
- **Egress:** Unlimited and FREE

### Usage Estimates

For a typical small business:
- **Receipts per month:** ~200 files × 500 KB = 100 MB
- **Storage per year:** ~1.2 GB (well within 10 GB limit)
- **Writes per month:** ~200 uploads (well within 1M limit)
- **Reads per month:** ~500 views (well within 10M limit)

**Estimated monthly cost: $0**

### Exceeding Free Tier

If you exceed the free tier:
- **Storage:** $0.015/GB/month
- **Class A Operations:** $4.50 per million
- **Class B Operations:** $0.36 per million
- **Egress:** FREE (no charges)

Example for 1,000 uploads/month with 5 GB storage:
- Storage: 5 GB × $0.015 = $0.075
- Writes: 0.001M × $4.50 = $0.0045
- **Total: ~$0.08/month**

---

## Best Practices

1. **Compress images** before upload to save storage
2. **Delete old files** periodically (implement cleanup job)
3. **Use meaningful filenames** for easier management
4. **Monitor usage** in Cloudflare Dashboard
5. **Backup important files** to another location
6. **Implement access logs** for audit trail
7. **Set up alerts** for storage quota warnings

---

## Next Steps

- [ ] Set up automatic backup of R2 to another provider
- [ ] Implement file deletion API endpoint
- [ ] Add thumbnail generation for images
- [ ] Implement file search and filtering
- [ ] Add virus scanning for uploaded files
- [ ] Set up CDN for faster file delivery
- [ ] Implement signed URLs for private files

---

## Support

For issues or questions:
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for general deployment help
- Check [TESTING_PLAN.md](TESTING_PLAN.md) for testing instructions
- Review Cloudflare R2 docs: https://developers.cloudflare.com/r2/
- Open an issue on GitHub

---

**Last updated:** October 2025  
**Version:** 1.0.0
