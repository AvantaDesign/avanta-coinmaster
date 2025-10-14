# 📊 Production Monitoring Dashboard - Avanta Finance

## Overview

This guide explains how to set up comprehensive monitoring for your production Avanta Finance deployment, including real-time dashboards, alerting, and performance tracking.

---

## 🎯 Table of Contents

1. [Cloudflare Analytics Dashboard](#-cloudflare-analytics-dashboard)
2. [Custom Application Analytics](#-custom-application-analytics)
3. [Error Monitoring](#-error-monitoring)
4. [Performance Monitoring](#-performance-monitoring)
5. [Database Monitoring](#-database-monitoring)
6. [Storage Monitoring](#-storage-monitoring)
7. [Alerting Setup](#-alerting-setup)
8. [Third-Party Integrations](#-third-party-integrations)
9. [Best Practices](#-best-practices)

---

## 📈 Cloudflare Analytics Dashboard

### Access Cloudflare Analytics

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Select your project (`avanta-finance`)
4. Click on **Analytics** tab

### Key Metrics to Monitor

#### 1. Traffic Metrics

**Requests**
- Total requests per day/week/month
- Requests per second (peak times)
- Geographic distribution of requests
- Requests by status code (200, 404, 500, etc.)

**What to look for:**
- ✅ Steady growth = good adoption
- ⚠️ Sudden spikes = investigate (bot attack? viral?)
- ❌ Many 5xx errors = system issues

**Healthy Metrics:**
```
Status 200: >95% of requests
Status 4xx: <3% of requests
Status 5xx: <1% of requests
```

#### 2. Performance Metrics

**CPU Time**
- Average CPU time per request
- Maximum CPU time (outliers)
- Trend over time

**What to look for:**
- ✅ <50ms average = excellent
- ⚠️ 50-200ms = acceptable
- ❌ >200ms = optimization needed

**Bandwidth**
- Data sent to clients
- Data received from clients
- Trend over time

**Duration**
- Time to first byte (TTFB)
- Total request duration
- P50, P75, P95, P99 percentiles

#### 3. Geographic Distribution

**Regions Map**
- Where your users are located
- Latency by region
- Most active data centers

**Use this to:**
- Understand your user base
- Identify slow regions
- Plan custom domain routing

#### 4. Invocations

**Workers Function Calls**
- Total invocations per day
- Invocations per endpoint
- Success vs failure rate

**Free Tier Limit:** 100,000 invocations/day

**Monitor closely:**
- Track daily usage vs limit
- Set alert at 80% (80,000/day)
- Optimize if approaching limit

### Creating Custom Views

**Time Range Selector**
- Last 24 hours
- Last 7 days
- Last 30 days
- Custom range

**Filter Options**
- By status code
- By country
- By method (GET, POST, etc.)
- By path (/api/transactions, etc.)

**Export Data**
- Download as CSV
- Use for custom analysis
- Share with team/stakeholders

---

## 🔍 Custom Application Analytics

### Built-in Analytics Tracking

Avanta Finance includes custom analytics (see `src/utils/analytics.js`).

### Tracked Events

#### 1. Page Views
```javascript
// Automatically tracked on route change
{
  event: 'page_view',
  page: '/transactions',
  timestamp: '2025-10-14T12:00:00Z'
}
```

#### 2. User Interactions
```javascript
// Button clicks, form submissions
{
  event: 'button_click',
  button: 'add_transaction',
  page: '/transactions'
}
```

#### 3. API Calls
```javascript
// API requests and responses
{
  event: 'api_call',
  endpoint: '/api/transactions',
  method: 'POST',
  status: 200,
  duration: 145
}
```

#### 4. Errors
```javascript
// Caught errors
{
  event: 'error',
  message: 'Failed to fetch',
  page: '/dashboard',
  severity: 'error'
}
```

### View Analytics Data

Analytics are stored in Cloudflare Analytics Engine or your custom backend.

**Option 1: Cloudflare Analytics Engine**

1. Enable in Dashboard:
   - Workers & Pages → Your project
   - Analytics Engine → Enable

2. Query via GraphQL:
```graphql
query {
  viewer {
    accounts(filter: {accountTag: "your-account-id"}) {
      analyticsEngineMetrics(
        filter: {
          dataset: "avanta_finance_events"
        }
        limit: 100
      ) {
        dimensions {
          blob1  # Event name
          blob2  # Page
        }
        sum {
          double1  # Count
        }
      }
    }
  }
}
```

**Option 2: Custom Dashboard**

Create a simple dashboard page:

```javascript
// src/pages/Analytics.jsx
import { useEffect, useState } from 'react';

export default function Analytics() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(setMetrics);
  }, []);

  return (
    <div>
      <h1>Analytics Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-4">
        <MetricCard 
          title="Page Views Today" 
          value={metrics?.pageViews} 
        />
        <MetricCard 
          title="Transactions Created" 
          value={metrics?.transactionsCreated} 
        />
        <MetricCard 
          title="Error Rate" 
          value={`${metrics?.errorRate}%`} 
        />
      </div>
      
      <EventsTable events={metrics?.recentEvents} />
    </div>
  );
}
```

### Popular Events to Track

**Financial Operations:**
- Transaction created
- Transaction edited
- Transaction deleted
- File uploaded
- Invoice imported
- CSV imported

**User Engagement:**
- Dashboard viewed
- Fiscal calculator used
- Report generated
- Filter applied

**Performance:**
- Page load time
- API response time
- Database query time

---

## 🐛 Error Monitoring

### Built-in Error Tracking

Avanta Finance includes error monitoring (see `src/utils/errorMonitoring.js`).

### Error Categories

#### 1. JavaScript Errors
```javascript
// Automatically caught
window.onerror = (message, source, lineno, colno, error)
```

**Common errors:**
- TypeError: Cannot read property
- ReferenceError: variable not defined
- Network errors (fetch failed)

#### 2. Promise Rejections
```javascript
// Unhandled promise rejections
window.addEventListener('unhandledrejection', event)
```

#### 3. API Errors
```javascript
// HTTP errors from API calls
{
  error: 'API_ERROR',
  status: 500,
  endpoint: '/api/transactions',
  message: 'Database connection failed'
}
```

### Error Dashboard

**Access error logs:**

1. **Browser Console** (Development):
```javascript
// View errors in real-time
console.log('[Error]', error);
```

2. **Cloudflare Logs** (Production):
```bash
# Real-time tail
wrangler pages deployment tail

# Filter errors only
wrangler pages deployment tail --status error

# Filter by time
wrangler pages deployment tail --since 2h
```

3. **Custom Error API** (Optional):
```javascript
// Create /api/errors endpoint
export async function onRequest(context) {
  const { DB } = context.env;
  
  // Query error logs
  const errors = await DB.prepare(
    'SELECT * FROM error_logs ORDER BY timestamp DESC LIMIT 100'
  ).all();
  
  return Response.json(errors);
}
```

### Error Metrics to Monitor

**Error Rate:**
```
Target: <1% of requests
Warning: >2% of requests
Critical: >5% of requests
```

**Mean Time to Resolution (MTTR):**
```
Target: <4 hours
Good: <24 hours
Poor: >48 hours
```

**Error Categories:**
```
Client errors (4xx): User mistakes, expected
Server errors (5xx): System issues, needs fix
Network errors: Connectivity, timeout
```

### Setting Up Error Alerts

**Email Alerts:**
```bash
# Using n8n webhook (see N8N_WORKFLOWS.md)
# Triggers on error rate >5%

# Or Cloudflare Email Workers
# Configure in Dashboard → Email Routing
```

**Slack/Discord Alerts:**
```javascript
// In error handler
async function notifyError(error) {
  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 Error in Avanta Finance: ${error.message}`,
      severity: error.severity,
      timestamp: new Date().toISOString()
    })
  });
}
```

---

## ⚡ Performance Monitoring

### Web Vitals

Monitor Core Web Vitals for optimal user experience.

#### 1. Largest Contentful Paint (LCP)

**What it measures:** Loading performance

**Target Metrics:**
- Good: <2.5 seconds
- Needs Improvement: 2.5-4 seconds
- Poor: >4 seconds

**How to measure:**
```javascript
// In src/App.jsx
import { getLCP } from 'web-vitals';

getLCP(metric => {
  console.log('LCP:', metric.value);
  // Send to analytics
  trackEvent('web_vital', {
    name: 'LCP',
    value: metric.value
  });
});
```

**Improving LCP:**
- Optimize images (compress, modern formats)
- Enable CDN caching
- Minimize CSS/JS
- Use code splitting

#### 2. First Input Delay (FID)

**What it measures:** Interactivity

**Target Metrics:**
- Good: <100 milliseconds
- Needs Improvement: 100-300 ms
- Poor: >300 ms

**How to measure:**
```javascript
import { getFID } from 'web-vitals';

getFID(metric => {
  console.log('FID:', metric.value);
});
```

**Improving FID:**
- Minimize JavaScript execution time
- Break up long tasks
- Use web workers for heavy computation
- Defer non-critical JavaScript

#### 3. Cumulative Layout Shift (CLS)

**What it measures:** Visual stability

**Target Metrics:**
- Good: <0.1
- Needs Improvement: 0.1-0.25
- Poor: >0.25

**How to measure:**
```javascript
import { getCLS } from 'web-vitals';

getCLS(metric => {
  console.log('CLS:', metric.value);
});
```

**Improving CLS:**
- Set dimensions for images/videos
- Don't insert content above existing content
- Use transform animations instead of layout properties

### API Performance

**Track response times:**
```javascript
// In API handler
const start = Date.now();

// ... process request ...

const duration = Date.now() - start;
console.log(`API call took ${duration}ms`);

// Set header
return new Response(json, {
  headers: {
    'X-Response-Time': `${duration}ms`
  }
});
```

**Performance Targets:**
```
Dashboard API: <500ms
Transactions API (list): <800ms
Transaction API (single): <200ms
Upload API: <2000ms (depends on file size)
Fiscal API: <400ms
```

### Database Query Performance

**Monitor slow queries:**
```javascript
// In D1 operations
const queryStart = Date.now();
const result = await DB.prepare(query).all();
const queryDuration = Date.now() - queryStart;

if (queryDuration > 1000) {
  console.warn(`Slow query: ${query} took ${queryDuration}ms`);
}
```

**Optimization Tips:**
- Add indexes on frequently queried columns
- Use LIMIT for pagination
- Avoid SELECT * (specify columns)
- Use WHERE clauses effectively

---

## 🗄️ Database Monitoring

### D1 Usage Metrics

**Check current usage:**
```bash
# Via wrangler CLI
wrangler d1 info avanta-finance
```

**Expected output:**
```
Database: avanta-finance
UUID: abc123...
Size: 2.4 MB / 5 GB (0.05%)
Tables: 4
```

### Monitoring Queries

**Daily Operations Count:**
```
Target: <10,000 queries/day (well under 5M limit)
Warning: >1,000,000 queries/day
```

**Monitor via Dashboard:**
1. Cloudflare Dashboard → D1
2. Select `avanta-finance`
3. View **Analytics** tab
   - Read operations
   - Write operations
   - Storage used

### Query Performance

**Create performance tracking table:**
```sql
CREATE TABLE IF NOT EXISTS query_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_name TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Track queries:**
```javascript
async function logQuery(name, duration) {
  await DB.prepare(
    'INSERT INTO query_performance (query_name, duration_ms) VALUES (?, ?)'
  ).bind(name, duration).run();
}
```

**Analyze slow queries:**
```bash
wrangler d1 execute avanta-finance --command="
  SELECT query_name, AVG(duration_ms) as avg_time, COUNT(*) as count
  FROM query_performance
  GROUP BY query_name
  HAVING avg_time > 500
  ORDER BY avg_time DESC
"
```

### Database Health Checks

**Daily health check script:**
```bash
#!/bin/bash
# health-check.sh

echo "=== D1 Health Check ==="

# Check database exists
wrangler d1 list | grep -q "avanta-finance"
if [ $? -eq 0 ]; then
  echo "✅ Database exists"
else
  echo "❌ Database not found"
  exit 1
fi

# Check tables exist
tables=$(wrangler d1 execute avanta-finance --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'" --json)
if [[ $tables == *'"count":4'* ]]; then
  echo "✅ All tables exist"
else
  echo "⚠️ Table count mismatch"
fi

# Check can insert
wrangler d1 execute avanta-finance --command="INSERT INTO transactions (date, description, amount, type, category) VALUES ('2025-01-01', 'Health check', 1, 'gasto', 'personal')" > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Write operations working"
  # Clean up
  wrangler d1 execute avanta-finance --command="DELETE FROM transactions WHERE description = 'Health check'" > /dev/null
else
  echo "❌ Write operations failed"
fi

echo "=== Health Check Complete ==="
```

---

## 📦 Storage Monitoring

### R2 Usage Metrics

**Check current usage:**
```bash
# List buckets
wrangler r2 bucket list

# Get object count
wrangler r2 object list avanta-receipts | wc -l
```

**Monitor via Dashboard:**
1. Cloudflare Dashboard → R2
2. Select `avanta-receipts`
3. View metrics:
   - Storage used (MB/GB)
   - Object count
   - Request count (reads/writes)

### Storage Metrics

**Free Tier Limits:**
```
Storage: 10 GB
Class A Operations (writes): 1M/month
Class B Operations (reads): 10M/month
```

**Current Usage:**
```bash
# Get total size
wrangler r2 object list avanta-receipts --json | jq '[.[] | .size] | add'

# Get by file type
wrangler r2 object list avanta-receipts | grep ".pdf" | wc -l
```

### File Upload Analytics

**Track uploads:**
```javascript
// In /api/upload endpoint
await DB.prepare(`
  INSERT INTO upload_analytics (
    filename, size_bytes, file_type, upload_time_ms
  ) VALUES (?, ?, ?, ?)
`).bind(filename, size, type, duration).run();
```

**Monitor trends:**
```sql
-- Average upload size
SELECT AVG(size_bytes) / 1024 / 1024 as avg_size_mb
FROM upload_analytics;

-- Uploads per day
SELECT DATE(created_at) as date, COUNT(*) as count
FROM upload_analytics
GROUP BY date
ORDER BY date DESC
LIMIT 30;

-- Most common file types
SELECT file_type, COUNT(*) as count
FROM upload_analytics
GROUP BY file_type
ORDER BY count DESC;
```

---

## 🚨 Alerting Setup

### Cloudflare Notifications

**Configure in Dashboard:**
1. Go to **Notifications**
2. Click **Add**
3. Choose alert type

**Recommended Alerts:**

#### 1. High Error Rate
```
Trigger: Error rate >5% for 5 minutes
Action: Send email + webhook
```

#### 2. High Latency
```
Trigger: Average response time >2s for 10 minutes
Action: Send email
```

#### 3. Approaching Limits
```
Trigger: D1 writes >80K/day
Action: Send email
```

#### 4. Deployment Failure
```
Trigger: Deployment fails
Action: Send email + Slack
```

### Custom Alerts with n8n

Create workflow (see `N8N_WORKFLOWS.md`):

```javascript
// Error Alert Workflow
1. Webhook receives error
2. Check severity
3. If critical:
   - Send email
   - Post to Slack/Discord
   - Create GitHub issue
4. Store in database
5. Track resolution
```

### Email Alerts

**Setup via Cloudflare Workers:**
```javascript
// functions/api/alert.js
export async function onRequestPost(context) {
  const alert = await context.request.json();
  
  // Send email via SendGrid, Mailgun, etc.
  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${context.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: 'admin@yourdomain.com' }]
      }],
      from: { email: 'alerts@yourdomain.com' },
      subject: `Alert: ${alert.title}`,
      content: [{
        type: 'text/plain',
        value: alert.message
      }]
    })
  });
  
  return Response.json({ success: true });
}
```

---

## 🔗 Third-Party Integrations

### Grafana

**For advanced dashboards:**

1. Set up Grafana Cloud (free tier)
2. Install Cloudflare data source
3. Create dashboards with:
   - Request rate graphs
   - Error rate trends
   - Latency histograms
   - Geographic distribution maps

### Datadog

**APM and monitoring:**

1. Install Datadog integration
2. Configure RUM (Real User Monitoring)
3. Track:
   - Frontend performance
   - API performance
   - Error rates
   - User sessions

### Sentry

**Error tracking:**

```javascript
// Install
npm install @sentry/react

// Initialize in src/main.jsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: 'production',
  tracesSampleRate: 1.0
});
```

---

## ✅ Best Practices

### Daily Checks
- [ ] Review error rate (should be <1%)
- [ ] Check response times (should be <1s)
- [ ] Monitor request volume
- [ ] Verify no critical alerts

### Weekly Reviews
- [ ] Analyze traffic trends
- [ ] Review slow API endpoints
- [ ] Check database performance
- [ ] Monitor storage usage
- [ ] Review error logs and patterns

### Monthly Reports
- [ ] Total requests handled
- [ ] Average response time
- [ ] Error rate trend
- [ ] Storage usage vs limit
- [ ] Top errors and resolutions
- [ ] Web Vitals scores

### Quarterly Audits
- [ ] Full performance review
- [ ] Security audit
- [ ] Dependency updates
- [ ] Cost optimization
- [ ] Capacity planning
- [ ] User feedback integration

---

## 📱 Mobile Dashboard (Optional)

**Quick status check from phone:**

Create simple status page:

```html
<!-- public/status.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Avanta Finance Status</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { 
      font-family: system-ui; 
      padding: 20px; 
      max-width: 600px; 
      margin: 0 auto; 
    }
    .metric { 
      background: #f5f5f5; 
      padding: 15px; 
      margin: 10px 0; 
      border-radius: 8px; 
    }
    .good { border-left: 4px solid #10b981; }
    .warning { border-left: 4px solid #f59e0b; }
    .error { border-left: 4px solid #ef4444; }
  </style>
</head>
<body>
  <h1>🚀 System Status</h1>
  <div id="metrics">Loading...</div>
  
  <script>
    fetch('/api/health')
      .then(r => r.json())
      .then(data => {
        document.getElementById('metrics').innerHTML = `
          <div class="metric ${data.status}">
            <strong>Overall Status:</strong> ${data.status}
          </div>
          <div class="metric good">
            <strong>Response Time:</strong> ${data.responseTime}ms
          </div>
          <div class="metric good">
            <strong>Error Rate:</strong> ${data.errorRate}%
          </div>
          <div class="metric good">
            <strong>Uptime:</strong> ${data.uptime}%
          </div>
        `;
      });
  </script>
</body>
</html>
```

---

## 🎓 Conclusion

With proper monitoring in place, you can:
- Detect issues before users report them
- Track performance trends
- Optimize resource usage
- Plan capacity needs
- Demonstrate reliability

**Remember:**
- Monitor proactively, not reactively
- Set realistic thresholds
- Automate where possible
- Document all incidents
- Review and improve regularly

---

**For more information:**
- [Cloudflare Analytics Docs](https://developers.cloudflare.com/analytics/)
- [D1 Analytics](https://developers.cloudflare.com/d1/observability/)
- [R2 Metrics](https://developers.cloudflare.com/r2/observability/)
- [Web Vitals](https://web.dev/vitals/)

**Built with ❤️ by Mateo Reyes González / Avanta Design**
