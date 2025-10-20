# 📊 Analytics & Error Monitoring Setup Guide

Complete guide for setting up analytics tracking and error monitoring in Avanta Finance.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Analytics Setup](#analytics-setup)
3. [Error Monitoring](#error-monitoring)
4. [Integration](#integration)
5. [Custom Events](#custom-events)
6. [Performance Tracking](#performance-tracking)
7. [Dashboards](#dashboards)
8. [Best Practices](#best-practices)

---

## Overview

Avanta Finance includes comprehensive analytics and error monitoring:

### Analytics Features
- ✅ Page view tracking
- ✅ Custom event tracking
- ✅ User interaction tracking
- ✅ Performance metrics (Web Vitals)
- ✅ Conversion tracking
- ✅ Session tracking
- ✅ Cloudflare Web Analytics integration

### Error Monitoring Features
- ✅ Centralized error logging
- ✅ Structured logging with severity levels
- ✅ Error aggregation and reporting
- ✅ Request ID tracking
- ✅ Rate limiting
- ✅ Critical error alerts
- ✅ Performance monitoring

---

## Analytics Setup

### 1. Cloudflare Web Analytics

**Free, privacy-first analytics without cookies.**

#### Enable in Cloudflare Dashboard

1. Go to Cloudflare Dashboard → Your Domain → Analytics → Web Analytics
2. Click "Enable Web Analytics"
3. Copy the JavaScript snippet
4. Add to `index.html`:

```html
<!-- Cloudflare Web Analytics -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
        data-cf-beacon='{"token": "your-token-here"}'></script>
```

#### Features Included
- Page views and visitors
- Top pages and referrers
- Browser and device stats
- Geographic distribution
- Zero performance impact
- GDPR compliant (no cookies)

### 2. Custom Analytics

**Business-specific metrics tracking.**

#### Initialize Analytics

Already integrated in `src/App.jsx`:

```javascript
import { initializeAnalytics } from './utils/analytics';

useEffect(() => {
  initializeAnalytics();
}, []);
```

#### Track Page Views

Automatic tracking via router:

```javascript
import { trackPageView } from './utils/analytics';
import { useLocation } from 'react-router-dom';

function AnalyticsTracker() {
  const location = useLocation();
  
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);
  
  return null;
}
```

#### Track Custom Events

```javascript
import { trackEvent } from './utils/analytics';

// Transaction created
trackEvent('transaction_created', {
  amount: 1000,
  category: 'avanta',
  type: 'ingreso'
});

// CSV import
trackEvent('csv_import', {
  bankType: 'bbva',
  transactionCount: 25,
  success: true
});

// CFDI import
trackEvent('cfdi_import', {
  success: true,
  total: 14500
});
```

---

## Error Monitoring

### 1. Initialize Error Monitoring

Already integrated in `src/App.jsx`:

```javascript
import { initializeErrorMonitoring } from './utils/errorMonitoring';

useEffect(() => {
  initializeErrorMonitoring();
}, []);
```

### 2. Structured Logging

Use the logger throughout your application:

```javascript
import { logger } from './utils/errorMonitoring';

// Info logging
logger.info('Transaction created', { 
  transactionId: 123, 
  amount: 1000 
});

// Warning logging
logger.warn('Slow query detected', { 
  duration: 1500, 
  query: 'SELECT * FROM transactions' 
});

// Error logging
try {
  // some operation
} catch (error) {
  logger.error('Failed to create transaction', error, {
    context: 'transactions',
    userId: 'user-123'
  });
}

// Critical logging
logger.critical('Database connection lost', error, {
  timestamp: Date.now()
});
```

### 3. Error Tracking

Track errors automatically or manually:

```javascript
import { ErrorMonitor } from './utils/errorMonitoring';

// Manual error tracking
try {
  // risky operation
} catch (error) {
  ErrorMonitor.track(error, {
    page: '/transactions',
    action: 'create',
    userId: 'user-123'
  });
}

// Automatic tracking (already configured)
// - window.onerror events
// - Unhandled promise rejections
// - All logged errors
```

### 4. Performance Monitoring

Track performance of operations:

```javascript
import { PerformanceMonitor } from './utils/errorMonitoring';

// Start timing
PerformanceMonitor.start('database_query');

// ... perform operation ...

// End timing
const duration = PerformanceMonitor.end('database_query');
console.log(`Query took ${duration}ms`);

// Or use async wrapper
const result = await PerformanceMonitor.measure('api_call', async () => {
  return await fetch('/api/transactions');
});
```

---

## Integration

### API Endpoints Integration

#### Analytics API

```javascript
// Frontend sends events
fetch('/api/analytics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event: 'transaction_created',
    properties: {
      amount: 1000,
      category: 'avanta'
    }
  })
});

// Get analytics stats
fetch('/api/analytics/stats')
  .then(res => res.json())
  .then(data => console.log(data.stats));

// Get recent events
fetch('/api/analytics/events?limit=50')
  .then(res => res.json())
  .then(data => console.log(data.events));
```

#### Error Monitoring API

```javascript
// Frontend sends errors automatically
// Or send manually:
fetch('/api/errors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Failed to load data',
    stack: error.stack,
    context: { page: '/transactions' }
  })
});

// Get error stats
fetch('/api/errors/stats')
  .then(res => res.json())
  .then(data => console.log(data.stats));

// Get recent errors
fetch('/api/errors/recent?limit=20')
  .then(res => res.json())
  .then(data => console.log(data.errors));
```

---

## Custom Events

### Financial Tracking

```javascript
import { trackTransaction, trackCSVImport, trackCFDIImport } from './utils/analytics';

// Track financial transaction
trackTransaction('ingreso', 5000, 'avanta');

// Track CSV import
trackCSVImport('bbva', 25, true);

// Track CFDI import
trackCFDIImport(true, 14500);
```

### User Interactions

```javascript
import { trackInteraction } from './utils/analytics';

// Button clicks
trackInteraction('export_button', 'click', {
  format: 'csv',
  recordCount: 100
});

// Form submissions
trackInteraction('transaction_form', 'submit', {
  category: 'avanta',
  amount: 1000
});

// Filter usage
trackInteraction('filter', 'apply', {
  category: 'avanta',
  dateRange: '2024-10'
});
```

### Search and Filters

```javascript
import { trackSearch, trackFilter } from './utils/analytics';

// Search tracking
trackSearch('office depot', 5);

// Filter tracking
trackFilter({
  category: 'avanta',
  type: 'gasto',
  dateFrom: '2024-10-01',
  dateTo: '2024-10-31'
}, 25);
```

### Conversions

```javascript
import { trackConversion } from './utils/analytics';

// Track important milestones
trackConversion('transaction_created', 1000, {
  category: 'avanta',
  type: 'ingreso'
});

trackConversion('csv_imported', 25, {
  bankType: 'bbva'
});
```

---

## Performance Tracking

### Web Vitals

Automatically tracked:
- **LCP** (Largest Contentful Paint) - Load performance
- **FID** (First Input Delay) - Interactivity
- **CLS** (Cumulative Layout Shift) - Visual stability

View in analytics dashboard or logs.

### Custom Performance Metrics

```javascript
import { trackPerformance } from './utils/analytics';

// API response time
const start = Date.now();
await fetch('/api/transactions');
const duration = Date.now() - start;
trackPerformance('api_response_time', duration, {
  endpoint: '/api/transactions'
});

// Database query time
trackPerformance('db_query', 45, {
  query: 'SELECT * FROM transactions',
  unit: 'ms'
});

// Page load time
window.addEventListener('load', () => {
  const loadTime = performance.timing.loadEventEnd - 
                   performance.timing.navigationStart;
  trackPerformance('page_load_time', loadTime);
});
```

---

## Dashboards

### Create Custom Dashboard

Use the API endpoints to create a custom analytics dashboard:

```javascript
// Example: Analytics Dashboard Component
import { useState, useEffect } from 'react';

function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [errors, setErrors] = useState([]);
  
  useEffect(() => {
    // Fetch analytics stats
    fetch('/api/analytics/stats')
      .then(res => res.json())
      .then(data => setStats(data.stats));
    
    // Fetch error stats
    fetch('/api/errors/stats')
      .then(res => res.json())
      .then(data => setErrors(data.stats));
  }, []);
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold">Total Events</h3>
        <p className="text-3xl">{stats?.totalEvents || 0}</p>
      </div>
      
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold">Total Errors</h3>
        <p className="text-3xl">{errors?.totalErrors || 0}</p>
      </div>
      
      {/* Add more widgets */}
    </div>
  );
}
```

### Cloudflare Dashboard

View analytics in Cloudflare Dashboard:
1. Go to your domain
2. Click "Analytics"
3. View Web Analytics dashboard
4. See real-time and historical data

---

## Best Practices

### 1. Event Naming

Use consistent, descriptive event names:

```javascript
// Good ✅
trackEvent('transaction_created', { ... });
trackEvent('csv_import_success', { ... });
trackEvent('user_login', { ... });

// Bad ❌
trackEvent('event1', { ... });
trackEvent('click', { ... });
trackEvent('stuff', { ... });
```

### 2. Event Properties

Include relevant context:

```javascript
// Good ✅
trackEvent('transaction_created', {
  amount: 1000,
  category: 'avanta',
  type: 'ingreso',
  account: 'BBVA',
  timestamp: new Date().toISOString()
});

// Minimal ❌
trackEvent('transaction_created', {});
```

### 3. Error Context

Always provide context with errors:

```javascript
// Good ✅
logger.error('Failed to save transaction', error, {
  transactionId: 123,
  userId: 'user-456',
  operation: 'create',
  timestamp: Date.now()
});

// Minimal ❌
logger.error('Error', error);
```

### 4. Performance Considerations

- Analytics calls are non-blocking (async)
- Failed analytics calls don't affect user experience
- Rate limiting prevents excessive logging
- In-memory storage for recent errors (configurable)

### 5. Privacy

- No personal data in events (PII)
- User IDs are anonymized
- Cloudflare Web Analytics is GDPR compliant
- No third-party tracking cookies

### 6. Production vs Development

```javascript
// Logs in development, silent in production
if (import.meta.env.DEV) {
  console.log('[Analytics]', event);
}

// Set log level based on environment
import { setLogLevel, LogLevel } from './utils/errorMonitoring';

if (import.meta.env.PROD) {
  setLogLevel(LogLevel.WARN); // Only warnings and errors
} else {
  setLogLevel(LogLevel.DEBUG); // All logs
}
```

### 7. Testing

Test analytics before deploying:

```bash
# Run app locally
npm run dev

# Check browser console for analytics logs
# Verify API calls in Network tab
# Test error tracking by triggering errors
```

---

## Environment Variables

Add to `wrangler.toml`:

```toml
[vars]
ENABLE_ANALYTICS = "true"
ENABLE_DEBUG_LOGS = "false"

# Alert webhooks (optional)
ERROR_ALERT_WEBHOOK = "https://your-webhook.com/alert"
```

For secrets:

```bash
wrangler secret put ANALYTICS_API_KEY
wrangler secret put ERROR_TRACKING_TOKEN
```

---

## Monitoring Alerts

### Set up Critical Error Alerts

Configure webhook in `wrangler.toml`:

```toml
[vars]
ERROR_ALERT_WEBHOOK = "https://n8n.your-domain.com/webhook/alert"
```

Critical errors automatically trigger alerts via:
- Telegram
- Slack
- Email
- Custom webhook

---

## Example Implementation

### Complete Analytics Integration

```javascript
// src/pages/Transactions.jsx
import { trackEvent, trackInteraction } from '../utils/analytics';
import { logger } from '../utils/errorMonitoring';

function Transactions() {
  const handleCreate = async (transaction) => {
    try {
      logger.info('Creating transaction', { transaction });
      
      const response = await fetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(transaction)
      });
      
      if (!response.ok) throw new Error('Failed to create');
      
      const data = await response.json();
      
      // Track success
      trackEvent('transaction_created', {
        amount: transaction.amount,
        category: transaction.category
      });
      
      logger.info('Transaction created successfully', { 
        id: data.transaction.id 
      });
      
    } catch (error) {
      // Track error
      logger.error('Failed to create transaction', error, {
        transaction
      });
      
      trackEvent('transaction_error', {
        error: error.message
      });
    }
  };
  
  return (
    <div>
      <button onClick={() => {
        trackInteraction('export_button', 'click');
        handleExport();
      }}>
        Export
      </button>
    </div>
  );
}
```

---

## Resources

### Documentation
- [Cloudflare Web Analytics](https://developers.cloudflare.com/analytics/web-analytics/)
- [Web Vitals](https://web.dev/vitals/)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)

### Tools
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [Browser DevTools](https://developer.chrome.com/docs/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

**Last Updated:** October 2025  
**Version:** 1.0.0  
**Maintainer:** Avanta Finance Team

