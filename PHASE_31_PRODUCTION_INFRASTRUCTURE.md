# Phase 31: Production Infrastructure Setup Guide

## Overview

This guide provides instructions for setting up production-grade infrastructure for Phase 31 security enhancements. The current implementation uses in-memory storage for caching and rate limiting, which works for development but needs to be migrated to distributed storage for production.

## Current Implementation Status

### ✅ Implemented (Development-Ready)
- **Security Headers**: Full implementation using `getSecurityHeaders()`
- **Input Validation**: XSS/SQL injection prevention
- **Rate Limiting**: In-memory implementation
- **Caching**: In-memory implementation
- **Logging**: Console-based with optional database storage
- **Error Handling**: Centralized error responses
- **Audit Logging**: Database-backed audit trails

### 🔄 Production Migration Needed
- **Rate Limiting**: Migrate from in-memory to Cloudflare Durable Objects
- **Caching**: Migrate from in-memory to Cloudflare KV
- **Error Monitoring**: Configure webhook notifications

## Production Infrastructure Setup

### 1. Cloudflare KV for Caching

#### Step 1: Create KV Namespace
```bash
# Create KV namespace for cache
wrangler kv:namespace create "CACHE_KV"

# Create preview namespace for testing
wrangler kv:namespace create "CACHE_KV" --preview
```

#### Step 2: Update wrangler.toml
Add the KV binding configuration (use the ID from Step 1):
```toml
[[kv_namespaces]]
binding = "CACHE_KV"
id = "your-kv-namespace-id-here"
preview_id = "your-preview-kv-namespace-id-here"
```

#### Step 3: Update cache.js
Modify `functions/utils/cache.js` to use KV storage:
```javascript
export async function getFromCache(key, env = null) {
  if (!env?.CACHE_KV) {
    // Fallback to in-memory if KV not available
    return cache.get(key);
  }
  
  const value = await env.CACHE_KV.get(key, 'json');
  return value;
}

export async function setInCache(key, value, ttlSeconds, env = null) {
  if (!env?.CACHE_KV) {
    // Fallback to in-memory if KV not available
    cache.set(key, value, ttlSeconds);
    return;
  }
  
  await env.CACHE_KV.put(key, JSON.stringify(value), {
    expirationTtl: ttlSeconds
  });
}
```

### 2. Cloudflare Durable Objects for Rate Limiting

#### Step 1: Create Durable Object Class
Create `functions/durable-objects/rate-limiter.js`:
```javascript
export class RateLimiter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const identifier = url.searchParams.get('identifier');
    const namespace = url.searchParams.get('namespace');
    const maxRequests = parseInt(url.searchParams.get('maxRequests') || '100');
    const windowSeconds = parseInt(url.searchParams.get('windowSeconds') || '60');

    // Get current state
    const key = `${namespace}:${identifier}`;
    const data = await this.state.storage.get(key);
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    if (!data || now > data.windowStart + windowMs) {
      // New window
      await this.state.storage.put(key, {
        count: 1,
        windowStart: now
      });
      
      return new Response(JSON.stringify({
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: now + windowMs
      }));
    }

    // Same window
    const newCount = data.count + 1;
    
    if (newCount > maxRequests) {
      return new Response(JSON.stringify({
        allowed: false,
        remaining: 0,
        resetAt: data.windowStart + windowMs,
        retryAfter: Math.ceil((data.windowStart + windowMs - now) / 1000)
      }));
    }

    await this.state.storage.put(key, {
      count: newCount,
      windowStart: data.windowStart
    });

    return new Response(JSON.stringify({
      allowed: true,
      remaining: maxRequests - newCount,
      resetAt: data.windowStart + windowMs
    }));
  }
}
```

#### Step 2: Update wrangler.toml
Add the Durable Object binding:
```toml
[[durable_objects.bindings]]
name = "RATE_LIMITER"
class_name = "RateLimiter"
script_name = "avanta-coinmaster"

[[migrations]]
tag = "v1"
new_classes = ["RateLimiter"]
```

#### Step 3: Update rate-limiter.js
Modify `functions/utils/rate-limiter.js` to use Durable Objects:
```javascript
export async function checkRateLimit(request, config, identifier, env) {
  if (!env?.RATE_LIMITER) {
    // Fallback to in-memory rate limiting
    return checkRateLimitMemory(request, config, identifier);
  }

  const requestId = identifier || getClientIp(request);
  const id = env.RATE_LIMITER.idFromName(requestId);
  const stub = env.RATE_LIMITER.get(id);

  const url = new URL(request.url);
  url.searchParams.set('identifier', requestId);
  url.searchParams.set('namespace', config.namespace);
  url.searchParams.set('maxRequests', config.maxRequests.toString());
  url.searchParams.set('windowSeconds', config.windowSeconds.toString());

  const response = await stub.fetch(url);
  return await response.json();
}
```

### 3. Error Monitoring Webhooks

#### Step 1: Set Environment Variables
Configure webhook URLs in `wrangler.toml`:
```toml
[vars]
ERROR_ALERT_WEBHOOK = "https://your-n8n-instance.com/webhook/errors"
SECURITY_ALERT_WEBHOOK = "https://your-n8n-instance.com/webhook/security"
```

Or set them as secrets for production:
```bash
wrangler secret put ERROR_ALERT_WEBHOOK
wrangler secret put SECURITY_ALERT_WEBHOOK
```

#### Step 2: Webhook Integration
The error monitoring is already integrated in `functions/utils/logging.js`:
- `logError()` sends critical errors to the webhook
- `logSecurityEvent()` sends security alerts to the webhook

Example webhook payload:
```json
{
  "title": "🚨 Error Alert",
  "severity": "high",
  "message": "Database query failed",
  "timestamp": "2025-10-20T00:27:41.281Z",
  "environment": "production",
  "details": {
    "endpoint": "transactions",
    "method": "POST",
    "userId": "user-123"
  }
}
```

### 4. Database Tables for Logging

The logging system optionally stores errors and audit logs in the database. Ensure these tables exist:

```sql
-- Error logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table  
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id TEXT,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
```

### 5. Environment Variables Reference

Add these variables to `wrangler.toml` for production:

```toml
[env.production.vars]
# Security
ENABLE_RATE_LIMITING = "true"
ENABLE_DEBUG_LOGS = "false"

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE = "100"
RATE_LIMIT_AUTH_REQUESTS = "5"
RATE_LIMIT_WRITE_REQUESTS = "50"

# Caching
CACHE_TTL_SECONDS = "300"
CACHE_DASHBOARD_TTL = "300"
CACHE_REPORTS_TTL = "600"

# Error Monitoring
# Set these as secrets in production
# ERROR_ALERT_WEBHOOK = "https://..."
# SECURITY_ALERT_WEBHOOK = "https://..."
```

## Testing Production Infrastructure

### 1. Test KV Cache
```bash
# Create a test cache entry
wrangler kv:key put --binding=CACHE_KV "test-key" '{"test":"value"}'

# Read it back
wrangler kv:key get --binding=CACHE_KV "test-key"

# Delete it
wrangler kv:key delete --binding=CACHE_KV "test-key"
```

### 2. Test Durable Objects Rate Limiter
Deploy your application and test rate limiting:
```bash
# Make multiple requests to trigger rate limiting
for i in {1..150}; do
  curl -X POST https://your-app.pages.dev/api/transactions \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"test":"data"}'
done
```

### 3. Test Error Webhooks
Trigger an error and check your webhook endpoint receives the notification.

## Migration Checklist

- [ ] Create KV namespace for caching
- [ ] Update wrangler.toml with KV binding
- [ ] Modify cache.js to use KV with fallback
- [ ] Create Durable Object class for rate limiting
- [ ] Update wrangler.toml with Durable Objects binding
- [ ] Modify rate-limiter.js to use Durable Objects with fallback
- [ ] Configure error monitoring webhook URLs
- [ ] Create database tables for logging (if not exist)
- [ ] Deploy and test in preview environment
- [ ] Monitor logs and performance
- [ ] Deploy to production

## Monitoring and Maintenance

### Key Metrics to Monitor
1. **Rate Limit Hits**: Track how often rate limits are triggered
2. **Cache Hit Ratio**: Monitor cache effectiveness
3. **Error Rates**: Track application errors
4. **Security Events**: Monitor authentication failures, suspicious activities
5. **API Response Times**: Track performance impact

### Log Analysis
Review audit logs regularly:
```sql
-- Recent security events
SELECT * FROM audit_logs 
WHERE category = 'security' 
ORDER BY timestamp DESC 
LIMIT 100;

-- Recent errors
SELECT * FROM error_logs 
WHERE level IN ('error', 'critical')
ORDER BY timestamp DESC 
LIMIT 100;

-- User activity audit
SELECT * FROM audit_logs 
WHERE user_id = 'specific-user-id' 
ORDER BY timestamp DESC 
LIMIT 50;
```

## Cost Considerations

### Cloudflare Free Tier Limits
- **KV**: 100,000 reads/day, 1,000 writes/day
- **Durable Objects**: 1M requests/month (first million free)
- **Workers**: 100,000 requests/day

### Recommendations
- Use caching strategically to reduce KV reads
- Set appropriate TTLs to balance freshness and cost
- Monitor usage in Cloudflare dashboard
- Consider upgrading to paid tier for production workloads

## Support and Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare KV Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Durable Objects Documentation](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)

## Troubleshooting

### Issue: Rate Limiting Not Working
- Check if `ENABLE_RATE_LIMITING` is set to `"true"` in environment variables
- Verify Durable Objects binding is configured correctly
- Check Cloudflare dashboard for Durable Objects errors

### Issue: Cache Not Working
- Verify KV namespace binding is configured
- Check KV namespace has correct permissions
- Monitor KV metrics in Cloudflare dashboard

### Issue: Webhooks Not Firing
- Verify webhook URLs are correctly configured
- Check webhook endpoint is accessible
- Review error logs for webhook delivery failures
