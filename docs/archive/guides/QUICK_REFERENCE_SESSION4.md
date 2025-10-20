# 🚀 Quick Reference - Session 4 Features

Quick access guide to all new features implemented in Session 4.

---

## 📋 File Structure

```
avanta-coinmaster/
├── functions/api/
│   ├── webhooks/
│   │   └── n8n.js              # n8n webhook endpoints
│   ├── analytics.js            # Analytics API
│   └── errors.js               # Error monitoring API
├── src/
│   ├── utils/
│   │   ├── analytics.js        # Analytics tracking utility
│   │   ├── errorMonitoring.js  # Error monitoring utility
│   │   └── performance.js      # Performance optimization
│   └── App.jsx                 # Updated with analytics/error init
├── test-n8n-webhooks.sh        # Automated webhook tests
├── N8N_WORKFLOWS.md            # n8n integration guide
├── ANALYTICS_MONITORING.md     # Analytics setup guide
├── TESTING_SESSION_4.md        # Testing guide
├── SESSION_4_SUMMARY.md        # Session summary
└── IMPLEMENTATION_SUMMARY.md   # Updated with session 4
```

---

## 🤖 n8n Webhook Endpoints

### Base URL
```
/api/webhooks/n8n/
```

### 1. Transaction Classification
```bash
POST /api/webhooks/n8n/classify
Content-Type: application/json

{
  "transactionId": 123,
  "classification": {
    "category": "avanta",
    "isDeductible": true,
    "confidence": 0.95
  }
}
```

### 2. CSV Import
```bash
POST /api/webhooks/n8n/import-csv
Content-Type: application/json

{
  "fileName": "statement.csv",
  "csvData": "date,description,amount,type\n...",
  "bankType": "bbva",
  "autoImport": true
}
```

### 3. Invoice Notification
```bash
POST /api/webhooks/n8n/invoice-notification
Content-Type: application/json

{
  "invoiceId": 45,
  "notificationChannel": "telegram",
  "recipient": "123456789"
}
```

### 4. Payment Reminder
```bash
POST /api/webhooks/n8n/payment-reminder
Content-Type: application/json

{
  "month": "2024-10",
  "dueDate": "2024-11-17",
  "type": "both"
}
```

---

## 📊 Analytics API

### Track Event
```bash
POST /api/analytics
Content-Type: application/json

{
  "event": "transaction_created",
  "properties": {
    "amount": 1000,
    "category": "avanta"
  }
}
```

### Get Statistics
```bash
GET /api/analytics/stats
```

### Get Recent Events
```bash
GET /api/analytics/events?limit=50&type=transaction_created
```

---

## 🔍 Error Monitoring API

### Track Error
```bash
POST /api/errors
Content-Type: application/json

{
  "message": "Failed to load data",
  "stack": "Error: ...",
  "context": {
    "page": "/transactions"
  }
}
```

### Get Error Statistics
```bash
GET /api/errors/stats
```

### Get Recent Errors
```bash
GET /api/errors/recent?limit=20&source=frontend
```

---

## 💻 Frontend Usage

### Initialize Analytics & Error Monitoring

Already integrated in `App.jsx`:

```javascript
import { initializeAnalytics } from './utils/analytics';
import { initializeErrorMonitoring } from './utils/errorMonitoring';

useEffect(() => {
  initializeAnalytics();
  initializeErrorMonitoring();
}, []);
```

### Track Events

```javascript
import { trackEvent, trackTransaction, trackCSVImport } from './utils/analytics';

// Track custom event
trackEvent('button_clicked', { buttonId: 'export' });

// Track financial transaction
trackTransaction('ingreso', 5000, 'avanta');

// Track CSV import
trackCSVImport('bbva', 25, true);
```

### Log Messages

```javascript
import { logger } from './utils/errorMonitoring';

// Info
logger.info('Transaction created', { id: 123 });

// Warning
logger.warn('Slow query', { duration: 1500 });

// Error
logger.error('Failed to save', error, { context: 'transactions' });

// Critical
logger.critical('Database connection lost', error);
```

### Track Errors

```javascript
import { ErrorMonitor } from './utils/errorMonitoring';

try {
  // risky operation
} catch (error) {
  ErrorMonitor.track(error, {
    page: '/transactions',
    action: 'create'
  });
}
```

### Monitor Performance

```javascript
import { PerformanceMonitor } from './utils/errorMonitoring';

// Start timing
PerformanceMonitor.start('api_call');

// ... perform operation ...

// End timing
const duration = PerformanceMonitor.end('api_call');

// Or use async wrapper
const result = await PerformanceMonitor.measure('database_query', async () => {
  return await db.query('SELECT * FROM transactions');
});
```

---

## 🧪 Testing

### Run n8n Webhook Tests
```bash
./test-n8n-webhooks.sh http://localhost:8788
```

### Run All Tests
```bash
# n8n webhooks
./test-n8n-webhooks.sh http://localhost:8788

# API endpoints
./test-api.sh http://localhost:8788

# D1 database
./test-d1-database.sh test

# R2 storage
./test-r2-upload.sh http://localhost:8788

# CSV/CFDI
./test-csv-cfdi.sh
```

### Build Project
```bash
npm run build
```

### Start Dev Server
```bash
npm run build
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788
```

---

## 🔧 Configuration

### Environment Variables (wrangler.toml)

```toml
[vars]
# n8n webhooks
# N8N_WEBHOOK_CLASSIFY = "https://n8n.your-domain.com/webhook/classify"
# N8N_WEBHOOK_IMPORT = "https://n8n.your-domain.com/webhook/import"
# N8N_NOTIFICATION_WEBHOOK = "https://n8n.your-domain.com/webhook/notify"
# N8N_REMINDER_WEBHOOK = "https://n8n.your-domain.com/webhook/reminder"
# ERROR_ALERT_WEBHOOK = "https://n8n.your-domain.com/webhook/alert"

# Analytics
ENABLE_ANALYTICS = "true"
ENABLE_DEBUG_LOGS = "false"

# Tax rates
ISR_RATE = "0.20"  # 20%
IVA_RATE = "0.16"  # 16%
```

### Secrets (use wrangler secret)

```bash
# Webhook authentication
wrangler secret put N8N_WEBHOOK_SECRET

# Analytics API key (if needed)
wrangler secret put ANALYTICS_API_KEY

# Error tracking token (if needed)
wrangler secret put ERROR_TRACKING_TOKEN
```

---

## 📚 Documentation

### Main Guides

1. **N8N_WORKFLOWS.md** - Complete n8n integration guide
   - Setup instructions
   - 4 recommended workflows
   - Security best practices
   - Troubleshooting

2. **ANALYTICS_MONITORING.md** - Analytics & error monitoring setup
   - Cloudflare Web Analytics
   - Custom analytics
   - Error monitoring
   - Code examples

3. **TESTING_SESSION_4.md** - Comprehensive testing guide
   - 50+ test cases
   - Manual and automated tests
   - Production readiness checks
   - Troubleshooting

4. **SESSION_4_SUMMARY.md** - Session summary
   - Executive summary
   - Technical statistics
   - Testing results
   - Next steps

---

## 🎯 Quick Commands

```bash
# Setup
npm install
npm run build

# Development
npx wrangler pages dev dist --d1 DB=avanta-finance --port 8788

# Testing
./test-n8n-webhooks.sh http://localhost:8788

# Deploy
wrangler pages deploy dist

# Database
wrangler d1 execute avanta-finance --command="SELECT * FROM transactions LIMIT 5"

# Storage
wrangler r2 object list avanta-receipts

# Logs
wrangler pages deployment tail
```

---

## 🔑 Key Features

### n8n Integration
- ✅ 4 webhook endpoints
- ✅ AI classification
- ✅ CSV import from email
- ✅ Invoice notifications
- ✅ Payment reminders

### Analytics
- ✅ Page view tracking
- ✅ Custom events
- ✅ Web Vitals (LCP, FID, CLS)
- ✅ Performance metrics
- ✅ User/session tracking

### Error Monitoring
- ✅ Structured logging (5 levels)
- ✅ Error aggregation
- ✅ Performance monitoring
- ✅ Rate limiting
- ✅ Critical alerts

### Performance
- ✅ Response caching
- ✅ ETag support
- ✅ Rate limiting
- ✅ JSON optimization
- ✅ Query batching

---

## ✅ Production Checklist

- [x] Build succeeds
- [x] All tests passing (12/12)
- [x] Environment variables configured
- [x] Secrets set (if needed)
- [x] D1 database set up
- [x] R2 storage configured
- [x] Documentation complete
- [x] Monitoring active
- [x] Tax system verified (ISR 20%, IVA 16%)

---

## 🆘 Troubleshooting

### Webhook not working?
```bash
# Check D1 connection
wrangler d1 execute avanta-finance --command="SELECT 1"

# Check webhook secret
wrangler secret list

# View logs
wrangler pages deployment tail
```

### Analytics not tracking?
- Check browser console for errors
- Verify `initializeAnalytics()` called
- Check Network tab for POST requests

### Errors not logged?
- Check `initializeErrorMonitoring()` called
- Verify console for initialization message
- Test manual error tracking

---

## 📞 Support

### Documentation
- N8N_WORKFLOWS.md - n8n setup
- ANALYTICS_MONITORING.md - Analytics setup
- TESTING_SESSION_4.md - Testing guide
- SESSION_4_SUMMARY.md - Session overview

### Test Scripts
- test-n8n-webhooks.sh - Webhook tests
- test-api.sh - API tests
- test-d1-database.sh - Database tests
- test-r2-upload.sh - Storage tests

---

**Quick Reference v1.0.0**  
**Last Updated:** October 14, 2025  
**Session:** 4 - n8n + Analytics + Final Polish

