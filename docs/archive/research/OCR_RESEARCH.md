# OCR Solutions Research for Receipt Processing

## Executive Summary

This document evaluates OCR (Optical Character Recognition) solutions for implementing receipt processing in Avanta Finance.

## Evaluation Criteria

1. **Cost**: Free tier availability and pricing structure
2. **Accuracy**: OCR quality for Spanish receipts and Mexican invoices
3. **Integration**: Compatibility with Cloudflare Workers
4. **Performance**: Processing time and reliability
5. **Maintenance**: Ease of implementation and updates

## Solutions Evaluated

### 1. Tesseract.js (Client-Side)

**Pros:**
- Completely free and open-source
- No API costs or limits
- Privacy-friendly (client-side processing)
- No external dependencies once loaded

**Cons:**
- Runs in browser (client-side), slower on mobile devices
- Large WASM bundle (~4-6MB for Spanish language pack)
- Lower accuracy compared to cloud services
- Requires significant client-side resources

**Integration:**
- ✅ Works in browser with React
- ⚠️ Not compatible with Cloudflare Workers (requires WASM with filesystem access)
- Must run client-side, not server-side

**Verdict:** Good for MVP, free, but limited accuracy and performance on mobile.

---

### 2. Google Cloud Vision API

**Pros:**
- High accuracy for text detection
- Excellent support for Spanish and multiple languages
- Fast processing (typically <2 seconds)
- 1,000 free OCR requests per month
- Good documentation and SDKs

**Cons:**
- Requires Google Cloud account
- $1.50 per 1,000 requests after free tier
- Requires API key management
- External dependency

**Integration:**
- ✅ REST API compatible with Cloudflare Workers fetch()
- Simple to implement with API key
- Can be called from Workers backend

**Pricing:**
- Free: 1,000 requests/month
- Paid: $1.50 per 1,000 requests (0.0015/request)
- Estimated cost: ~$1.50-5/month for typical usage

**Verdict:** Best balance of accuracy and cost. Recommended for production.

---

### 3. AWS Textract

**Pros:**
- Very high accuracy
- Structured data extraction (line items, totals, etc.)
- Good for complex receipts and invoices
- 1,000 pages free per month (first 3 months)

**Cons:**
- More expensive than alternatives
- Requires AWS account setup
- More complex integration
- Overkill for simple receipt scanning

**Integration:**
- ✅ REST API compatible with Cloudflare Workers
- Requires AWS signature v4 (more complex auth)

**Pricing:**
- Free: 1,000 pages/month for first 3 months
- Paid: $1.50 per 1,000 pages for Detect Document Text
- Additional costs for structured data extraction

**Verdict:** Best accuracy but more expensive. Consider for future enhancement.

---

### 4. Azure Computer Vision

**Pros:**
- Good accuracy
- Fast processing
- Free tier available
- Good documentation

**Cons:**
- Requires Azure account
- More expensive than Google Vision
- Less popular, potentially less community support

**Integration:**
- ✅ REST API compatible with Cloudflare Workers

**Pricing:**
- Free: 5,000 transactions/month
- Paid: $1.00 per 1,000 transactions (S1 tier)

**Verdict:** Good alternative to Google Vision, slightly better free tier.

---

## Recommendation: Phased Approach

### Phase 1 (MVP - Current): Tesseract.js Client-Side

**Rationale:**
- Zero cost
- Quick to implement
- Good enough for initial testing
- No API keys or accounts needed
- User privacy (data stays in browser)

**Implementation:**
```javascript
// Client-side OCR with Tesseract.js
import Tesseract from 'tesseract.js';

async function processReceiptClientSide(imageFile) {
  const result = await Tesseract.recognize(
    imageFile,
    'spa', // Spanish language
    {
      logger: m => console.log(m)
    }
  );
  return result.data.text;
}
```

**Limitations:**
- Slower on mobile devices
- Lower accuracy
- Large bundle size
- User must wait for processing

---

### Phase 2 (Production Enhancement): Google Cloud Vision API

**Rationale:**
- Much better accuracy (>95% vs ~70% for Tesseract)
- Server-side processing (faster, more reliable)
- Reasonable cost ($1.50-5/month expected)
- Professional solution

**Implementation:**
```javascript
// Server-side OCR with Google Cloud Vision
async function processReceiptServerSide(imageBuffer, apiKey) {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: imageBuffer.toString('base64') },
          features: [{ type: 'TEXT_DETECTION' }]
        }]
      })
    }
  );
  const data = await response.json();
  return data.responses[0].fullTextAnnotation?.text;
}
```

**When to Upgrade:**
- User feedback indicates accuracy issues
- User base grows and can justify costs
- Processing speed becomes important
- Business value is proven

---

## Implementation Plan

### Current Phase (Phase 9): Client-Side with Tesseract.js

1. **Install Tesseract.js:**
   ```bash
   npm install tesseract.js
   ```

2. **Create OCR utility for browser:**
   - File: `src/utils/ocrProcessor.js`
   - Client-side processing
   - Spanish language support
   - Basic text extraction
   - No structured data parsing initially

3. **UI Components:**
   - `ReceiptUpload.jsx`: File upload with preview
   - `ReceiptProcessor.jsx`: Show OCR progress and results
   - `ReceiptManager.jsx`: List and manage receipts

4. **User Flow:**
   - User uploads receipt → saved to R2
   - User clicks "Process Receipt" → Tesseract.js runs in browser
   - User reviews OCR text → manually creates/links transaction
   - No automatic transaction creation initially

### Future Phase: Server-Side with Cloud Vision

1. **Setup Google Cloud:**
   - Create project and enable Vision API
   - Generate API key
   - Store in Wrangler secrets: `wrangler secret put GOOGLE_VISION_API_KEY`

2. **Backend Processing:**
   - Add endpoint: `POST /api/receipts/:id/process-cloud`
   - Call Google Vision API from Cloudflare Workers
   - Parse response and extract structured data
   - Store in database

3. **Enhanced Features:**
   - Automatic amount detection
   - Date extraction
   - Merchant name detection
   - Confidence scores per field
   - Auto-suggest transaction creation

---

## Cost Analysis

### Scenario: 100 users, 10 receipts/user/month = 1,000 receipts/month

| Solution | Free Tier | Cost After Free Tier | Total Monthly Cost |
|----------|-----------|---------------------|-------------------|
| Tesseract.js | Unlimited | $0 | $0 |
| Google Vision | 1,000 free | $0 for 1,000 | $0 (within free tier) |
| Google Vision (2,000 receipts) | 1,000 free | $1.50 per 1,000 | $1.50 |
| Azure Vision | 5,000 free | $0 for 5,000 | $0 |
| AWS Textract | 1,000 free (3mo) | $1.50 per 1,000 | $1.50 |

**Conclusion:** Even with 2,000-5,000 receipts per month, costs would be minimal ($1.50-7.50/month).

---

## Decision

**For Phase 9:**
- ✅ Implement Tesseract.js client-side OCR
- ✅ Build UI and workflow
- ✅ Prove concept and gather user feedback
- ⚠️ Document limitations clearly to users
- 📋 Plan for Google Cloud Vision upgrade in Phase 10+

**Success Criteria:**
- Users can upload receipts ✅
- Basic OCR text extraction works ✅
- Users can manually correct and link to transactions ✅
- Zero cost for MVP ✅

**Upgrade Triggers:**
- User feedback: "OCR accuracy is poor"
- Usage: >1,000 receipts/month processed
- Revenue: Application generating income to cover API costs
- Features: Need structured data extraction (amounts, dates, etc.)

---

## Next Steps

1. ✅ Document OCR research (this file)
2. ⏭️ Create `src/utils/ocrProcessor.js` with Tesseract.js
3. ⏭️ Build `ReceiptUpload.jsx` component
4. ⏭️ Build `ReceiptProcessor.jsx` component
5. ⏭️ Build `ReceiptManager.jsx` component
6. ⏭️ Test and iterate
7. 📋 Plan Google Cloud Vision migration for future phase
