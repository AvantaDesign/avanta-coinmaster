# 🤖 n8n Workflow Integration Guide

Complete guide for integrating Avanta Finance with n8n workflows for automation.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Webhook Endpoints](#webhook-endpoints)
4. [Recommended Workflows](#recommended-workflows)
5. [Security](#security)
6. [Examples](#examples)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

n8n integration allows you to automate financial management tasks:

- **Auto-import Facturas**: Parse CFDI XML from email and import automatically
- **AI Transaction Classification**: Use Claude/GPT to categorize expenses
- **Payment Reminders**: Get notified before tax deadlines (día 17)
- **CSV Import from Email**: Auto-import bank statements sent via email
- **Invoice Notifications**: Get alerts when new invoices arrive

### Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Email     │         │     n8n     │         │   Avanta    │
│   Provider  │────────▶│   Workflow  │────────▶│   Finance   │
└─────────────┘         └─────────────┘         └─────────────┘
                              │                         │
                              │                         │
                              ▼                         ▼
                        ┌─────────────┐         ┌─────────────┐
                        │  Telegram/  │         │ Cloudflare  │
                        │    Slack    │         │  D1 + R2    │
                        └─────────────┘         └─────────────┘
```

---

## Setup

### 1. Install n8n

Self-hosted:
```bash
npm install -g n8n
n8n start
# Access at http://localhost:5678
```

Cloud (recommended):
```bash
# Sign up at https://n8n.io
# Create new instance
# Get your instance URL
```

### 2. Configure Environment Variables

Add to `wrangler.toml`:

```toml
[vars]
# n8n Webhook URLs
N8N_WEBHOOK_CLASSIFY = "https://your-n8n-instance.com/webhook/classify"
N8N_WEBHOOK_IMPORT = "https://your-n8n-instance.com/webhook/import"
N8N_NOTIFICATION_WEBHOOK = "https://your-n8n-instance.com/webhook/notify"
N8N_REMINDER_WEBHOOK = "https://your-n8n-instance.com/webhook/reminder"

# Webhook authentication (optional but recommended)
N8N_WEBHOOK_SECRET = "your-secret-key-here"

# Alert webhook (for critical errors)
ERROR_ALERT_WEBHOOK = "https://your-n8n-instance.com/webhook/alert"
```

Or use Cloudflare dashboard to set secrets:
```bash
wrangler secret put N8N_WEBHOOK_SECRET
```

### 3. Test Webhook Endpoints

```bash
# Run tests
./test-n8n-webhooks.sh http://localhost:8788

# Or test production
./test-n8n-webhooks.sh https://your-app.pages.dev
```

---

## Webhook Endpoints

### 1. Transaction Classification

**Endpoint:** `POST /api/webhooks/n8n/classify`

**Purpose:** Update transaction category and deductible status using AI classification.

**Payload:**
```json
{
  "transactionId": 123,
  "description": "Compra en Office Depot",
  "amount": 500,
  "classification": {
    "category": "avanta",
    "isDeductible": true,
    "confidence": 0.95
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction classified successfully",
  "transactionId": 123,
  "classification": {
    "category": "avanta",
    "isDeductible": true,
    "confidence": 0.95
  }
}
```

---

### 2. CSV Import

**Endpoint:** `POST /api/webhooks/n8n/import-csv`

**Purpose:** Import bank transactions from CSV file (email attachment).

**Payload:**
```json
{
  "fileName": "bbva-statement-oct-2024.csv",
  "csvData": "date,description,amount,type\n2024-10-01,Ingreso,5000,ingreso",
  "bankType": "bbva",
  "autoImport": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Imported 10 transactions successfully",
  "fileName": "bbva-statement-oct-2024.csv",
  "bankType": "bbva",
  "parsed": 10,
  "imported": 10
}
```

---

### 3. Invoice Notification

**Endpoint:** `POST /api/webhooks/n8n/invoice-notification`

**Purpose:** Send notification when new invoice is received.

**Payload:**
```json
{
  "invoiceId": 45,
  "uuid": "12345678-1234-1234-1234-123456789012",
  "emisor": "ACME Corp",
  "total": 14500,
  "notificationChannel": "telegram",
  "recipient": "123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification processed",
  "invoice": {
    "uuid": "12345678-1234-1234-1234-123456789012",
    "emisor": "ACME Corp",
    "total": 14500
  },
  "channel": "telegram",
  "sent": true
}
```

---

### 4. Payment Reminder

**Endpoint:** `POST /api/webhooks/n8n/payment-reminder`

**Purpose:** Send payment reminder for ISR/IVA taxes.

**Payload:**
```json
{
  "month": "2024-10",
  "type": "both",
  "dueDate": "2024-11-17",
  "notificationChannel": "telegram"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment reminder processed",
  "reminder": {
    "month": "2024-10",
    "dueDate": "2024-11-17",
    "income": "50000.00",
    "deductibleExpenses": "15000.00",
    "profit": "35000.00",
    "isr": "7000.00",
    "iva": "5600.00",
    "total": "12600.00"
  }
}
```

---

## Recommended Workflows

### Workflow 1: Auto-import Facturas Email

**Trigger:** Email arrives with XML attachment  
**Frequency:** Real-time (IMAP)  
**Complexity:** Medium

**Steps:**
1. **Email Trigger (IMAP)**
   - Server: imap.gmail.com
   - Filter: Subject contains "Factura" OR has .xml attachment
   
2. **Filter XML Attachments**
   - Check if attachment is .xml
   - Parse attachment content

3. **HTTP Request to Avanta**
   ```
   POST https://your-app.pages.dev/api/invoices
   Body: {
     xmlContent: {{$json.attachment.content}},
     autoCreate: true
   }
   ```

4. **Send Telegram Notification**
   ```
   Factura recibida: {{$json.uuid}}
   Emisor: {{$json.emisor}}
   Total: ${{$json.total}}
   ```

**n8n JSON:**
```json
{
  "name": "Auto-import Facturas Email",
  "nodes": [
    {
      "name": "Email Trigger",
      "type": "n8n-nodes-base.emailReadImap",
      "parameters": {
        "mailbox": "INBOX",
        "format": "resolved",
        "options": {
          "attachments": true
        }
      }
    },
    {
      "name": "Filter XML",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.attachments[0].filename}}",
              "operation": "endsWith",
              "value2": ".xml"
            }
          ]
        }
      }
    },
    {
      "name": "Import Invoice",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-app.pages.dev/api/invoices",
        "method": "POST",
        "body": {
          "xmlContent": "={{$json.attachments[0].content}}"
        }
      }
    },
    {
      "name": "Telegram Notification",
      "type": "n8n-nodes-base.telegram",
      "parameters": {
        "chatId": "YOUR_CHAT_ID",
        "text": "Factura: {{$json.uuid}}\nTotal: ${{$json.total}}"
      }
    }
  ]
}
```

---

### Workflow 2: Alerta Día 17 (Tax Deadline)

**Trigger:** Cron (monthly on day 10)  
**Frequency:** Monthly  
**Complexity:** Simple

**Steps:**
1. **Cron Trigger**
   - Schedule: `0 9 10 * *` (9 AM, day 10 of each month)
   
2. **Get Fiscal Summary**
   ```
   GET https://your-app.pages.dev/api/fiscal?month=current
   ```

3. **Calculate Days Until Deadline**
   ```javascript
   const dueDate = new Date();
   dueDate.setMonth(dueDate.getMonth() + 1);
   dueDate.setDate(17);
   const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
   ```

4. **Send Telegram Alert**
   ```
   🚨 Recordatorio de Impuestos
   
   Mes: {{$json.month}}
   Vence: 17 de {{$json.nextMonth}}
   Faltan: {{$json.daysLeft}} días
   
   ISR: ${{$json.isr}}
   IVA: ${{$json.iva}}
   Total: ${{$json.total}}
   ```

**n8n JSON:**
```json
{
  "name": "Alerta Día 17",
  "nodes": [
    {
      "name": "Cron Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "cronExpression": "0 9 10 * *"
      }
    },
    {
      "name": "Get Fiscal Data",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-app.pages.dev/api/fiscal?month=current",
        "method": "GET"
      }
    },
    {
      "name": "Send Reminder",
      "type": "n8n-nodes-base.telegram",
      "parameters": {
        "chatId": "YOUR_CHAT_ID",
        "text": "🚨 ISR: ${{$json.isr}}\nIVA: ${{$json.iva}}\nVence: 17"
      }
    }
  ]
}
```

---

### Workflow 3: AI Transaction Classification

**Trigger:** Webhook from Avanta (when transaction created)  
**Frequency:** Real-time  
**Complexity:** Advanced

**Steps:**
1. **Webhook Trigger**
   - URL: `/webhook/classify-transaction`
   - Method: POST

2. **Call LLM (Claude/GPT)**
   ```
   Prompt: "Clasifica este gasto:
   Descripción: {{$json.description}}
   Monto: ${{$json.amount}}
   
   Categoría (personal/avanta):
   Deducible (sí/no):
   Confianza (0-1):"
   ```

3. **Parse LLM Response**
   ```javascript
   const response = $json.response;
   const category = response.includes('avanta') ? 'avanta' : 'personal';
   const isDeductible = response.toLowerCase().includes('sí');
   const confidence = 0.85; // Parse from response
   ```

4. **Update Transaction**
   ```
   POST https://your-app.pages.dev/api/webhooks/n8n/classify
   Body: {
     transactionId: {{$json.id}},
     classification: {
       category: category,
       isDeductible: isDeductible,
       confidence: confidence
     }
   }
   ```

---

### Workflow 4: Import CSV Banco (Email Attachment)

**Trigger:** Email with CSV attachment  
**Frequency:** Real-time  
**Complexity:** Medium

**Steps:**
1. **Email Trigger (IMAP)**
   - Filter: Subject contains "Estado de Cuenta" OR attachment is .csv

2. **Extract CSV Attachment**
   ```javascript
   const attachment = $json.attachments.find(a => a.filename.endsWith('.csv'));
   const csvContent = attachment.content;
   ```

3. **Detect Bank Type**
   ```javascript
   const bankType = csvContent.includes('BBVA') ? 'bbva' :
                    csvContent.includes('Azteca') ? 'azteca' : 'generic';
   ```

4. **Import via Webhook**
   ```
   POST https://your-app.pages.dev/api/webhooks/n8n/import-csv
   Body: {
     fileName: {{$json.filename}},
     csvData: {{$json.csvContent}},
     bankType: {{$json.bankType}},
     autoImport: true
   }
   ```

5. **Send Success Notification**
   ```
   Importadas {{$json.imported}} transacciones
   Banco: {{$json.bankType}}
   ```

---

## Security

### Authentication

All webhook endpoints support Bearer token authentication:

```bash
# Set webhook secret
wrangler secret put N8N_WEBHOOK_SECRET

# In n8n, add Authorization header
Authorization: Bearer your-secret-key-here
```

### Best Practices

1. **Use HTTPS only** - Never use HTTP in production
2. **Rotate secrets regularly** - Change webhook secrets every 90 days
3. **Limit webhook access** - Use IP whitelisting if possible
4. **Validate all inputs** - Always validate webhook payloads
5. **Rate limiting** - Implement rate limiting on n8n side
6. **Log all requests** - Keep audit trail of webhook calls
7. **Monitor errors** - Set up alerts for failed webhooks

---

## Examples

### Example 1: Telegram Bot Integration

```javascript
// n8n Code node
const axios = require('axios');

// Get fiscal data
const fiscalResponse = await axios.get('https://your-app.pages.dev/api/fiscal?month=current');
const { isr, iva, total } = fiscalResponse.data;

// Format message
const message = `
💰 Resumen Fiscal - ${new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}

ISR: $${isr.toLocaleString('es-MX')}
IVA: $${iva.toLocaleString('es-MX')}
━━━━━━━━━━━━━━━━━
Total: $${total.toLocaleString('es-MX')}

📅 Vence: 17 del mes siguiente
`;

// Send to Telegram
await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
  chat_id: process.env.TELEGRAM_CHAT_ID,
  text: message,
  parse_mode: 'Markdown'
});

return { success: true };
```

### Example 2: Slack Integration

```javascript
// n8n Code node
const axios = require('axios');

// Get recent transactions
const response = await axios.get('https://your-app.pages.dev/api/transactions?limit=5');
const transactions = response.data.transactions;

// Format Slack message
const blocks = [
  {
    type: 'header',
    text: {
      type: 'plain_text',
      text: '📊 Últimas Transacciones'
    }
  },
  ...transactions.map(t => ({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${t.description}*\n${t.date} - $${t.amount} MXN`
    }
  }))
];

// Send to Slack
await axios.post(process.env.SLACK_WEBHOOK_URL, { blocks });

return { success: true };
```

---

## Testing

### Local Testing

```bash
# Start local dev server
npm run build
npx wrangler pages dev dist --d1 DB=avanta-finance --port 8788

# Run webhook tests
./test-n8n-webhooks.sh http://localhost:8788
```

### Manual Testing with curl

```bash
# Test classification webhook
curl -X POST http://localhost:8788/api/webhooks/n8n/classify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret" \
  -d '{
    "transactionId": 1,
    "classification": {
      "category": "avanta",
      "isDeductible": true,
      "confidence": 0.95
    }
  }'

# Test CSV import webhook
curl -X POST http://localhost:8788/api/webhooks/n8n/import-csv \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.csv",
    "csvData": "date,description,amount,type\n2024-10-01,Test,1000,ingreso",
    "autoImport": false
  }'

# Test payment reminder webhook
curl -X POST http://localhost:8788/api/webhooks/n8n/payment-reminder \
  -H "Content-Type: application/json" \
  -d '{
    "month": "2024-10",
    "dueDate": "2024-11-17",
    "type": "both"
  }'
```

---

## Troubleshooting

### Common Issues

#### 1. Webhook Returns 401 Unauthorized

**Problem:** Authentication failing  
**Solution:**
```bash
# Check if secret is set
wrangler secret list

# Set secret if missing
wrangler secret put N8N_WEBHOOK_SECRET

# In n8n, ensure Authorization header is set correctly
Authorization: Bearer your-secret-key
```

#### 2. Webhook Returns 503 Service Unavailable

**Problem:** Database not configured  
**Solution:**
```bash
# Check D1 binding
wrangler d1 list

# Verify wrangler.toml has correct database_id
# Test database connection
wrangler d1 execute avanta-finance --command="SELECT 1"
```

#### 3. CSV Import Fails

**Problem:** Invalid CSV format  
**Solution:**
- Verify CSV has proper headers
- Check for special characters in CSV
- Validate date format (YYYY-MM-DD)
- Test with sample CSV from `/samples` directory

#### 4. Transaction Classification Not Working

**Problem:** Transaction ID not found  
**Solution:**
```bash
# Check if transaction exists
curl http://localhost:8788/api/transactions/1

# Verify transaction ID in payload
# Ensure D1 database has data
```

#### 5. n8n Workflow Not Triggering

**Problem:** Webhook not receiving calls  
**Solution:**
- Check n8n workflow is activated
- Verify webhook URL is correct
- Test webhook manually with curl
- Check n8n logs for errors
- Ensure n8n instance is accessible from internet (for email triggers)

---

## Additional Resources

### Documentation
- [n8n Documentation](https://docs.n8n.io/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)

### Example Workflows
- [n8n Workflow Templates](https://n8n.io/workflows)
- [Finance Automation Examples](https://n8n.io/workflows?categories=Finance)

### Support
- Open an issue on GitHub
- Join n8n Community Discord
- Check Cloudflare Community Forums

---

**Last Updated:** October 2025  
**Version:** 1.0.0  
**Maintainer:** Avanta Finance Team

