# Local Development Setup Guide

Complete guide for setting up Avanta Coinmaster API for local development.

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Wrangler CLI**: Latest version (Cloudflare Workers CLI)
- **Git**: Latest version

## Quick Setup (5 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/AvantaDesign/avanta-coinmaster.git
cd avanta-coinmaster
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the project root:

```env
# JWT Secret (use a secure random string in production)
JWT_SECRET=your-secure-secret-key-change-in-production

# Environment
ENVIRONMENT=development

# App Version
APP_VERSION=1.0.0
```

### 4. Setup Database

The project uses Cloudflare D1 (SQLite). For local development:

```bash
# Create local D1 database
wrangler d1 create avanta-coinmaster-dev

# Apply migrations
wrangler d1 migrations apply avanta-coinmaster-dev --local
```

### 5. Start Development Server

```bash
# Start frontend development server (Vite)
npm run dev

# Or start full stack (frontend + API workers)
npm run dev:full
```

### 6. Verify Installation

Open browser and navigate to:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:8788

Test the API:
```bash
curl http://localhost:8788/api/health
```

## Development Workflow

### Project Structure

```
avanta-coinmaster/
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── stores/             # Zustand state stores
│   └── utils/              # Utility functions
├── functions/              # Cloudflare Workers functions
│   ├── api/                # API endpoints (78+ files)
│   ├── utils/              # Backend utilities
│   └── _worker.js          # Main worker entry point
├── docs/                   # Documentation
│   └── api/                # API documentation
├── tests/                  # Test files
│   ├── api/                # API tests
│   ├── components/         # Component tests
│   └── e2e/                # E2E tests
├── migrations/             # Database migrations
├── schema.sql              # Database schema
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
└── wrangler.toml           # Cloudflare configuration
```

### Available Scripts

```bash
# Development
npm run dev                 # Start frontend dev server (Vite)
npm run dev:frontend        # Same as above
npm run dev:full            # Build + start full stack with API

# Building
npm run build               # Build for production

# Testing
npm run test                # Run tests in watch mode
npm run test:run            # Run tests once
npm run test:coverage       # Run tests with coverage
npm run test:api            # Run API tests only
npm run test:components     # Run component tests only
npm run test:e2e            # Run E2E tests with Playwright

# Database
npm run db:health           # Check database health
npm run db:check            # Check database tables
npm run db:list             # List all tables
npm run db:views            # List all views

# Deployment
npm run deploy              # Deploy to production
npm run deploy:preview      # Deploy to preview environment
```

### Database Management

#### Migrations

Create a new migration:
```bash
# Create migration file manually in migrations/
touch migrations/052_your_migration_name.sql
```

Apply migrations:
```bash
# Local
wrangler d1 migrations apply avanta-coinmaster-dev --local

# Production
wrangler d1 migrations apply avanta-coinmaster --remote
```

#### Seeding Data

```bash
# Load seed data
wrangler d1 execute avanta-coinmaster-dev --local --file=seed.sql
```

#### Database Queries

```bash
# Execute SQL command
wrangler d1 execute avanta-coinmaster-dev --local \
  --command="SELECT COUNT(*) FROM transactions"

# Execute from file
wrangler d1 execute avanta-coinmaster-dev --local --file=query.sql
```

### API Development

#### Creating a New Endpoint

1. **Create endpoint file**:
```bash
touch functions/api/my-endpoint.js
```

2. **Implement handlers**:
```javascript
import { getUserIdFromToken } from './auth.js';
import { getSecurityHeaders } from '../utils/security.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  
  // Authenticate
  const userId = await getUserIdFromToken(request, env);
  if (!userId) {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      code: 'AUTH_REQUIRED'
    }), {
      status: 401,
      headers: getSecurityHeaders()
    });
  }
  
  // Your logic here
  const data = await env.DB.prepare('SELECT * FROM table WHERE user_id = ?')
    .bind(userId)
    .all();
  
  return new Response(JSON.stringify(data.results), {
    headers: getSecurityHeaders()
  });
}

export async function onRequestPost(context) {
  // POST handler
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: getSecurityHeaders()
  });
}
```

3. **Test the endpoint**:
```bash
curl http://localhost:8788/api/my-endpoint \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Testing API Endpoints

Create test file in `tests/api/`:
```javascript
import { describe, it, expect, beforeEach } from 'vitest';

describe('My Endpoint API', () => {
  let token;
  
  beforeEach(async () => {
    // Setup
  });
  
  it('should return data', async () => {
    const response = await fetch('http://localhost:8788/api/my-endpoint', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
  });
});
```

Run tests:
```bash
npm run test:api
```

### Frontend Development

#### Creating Components

```bash
# Create new component
touch src/components/MyComponent.jsx
```

Example component:
```jsx
import React from 'react';

export default function MyComponent({ prop1, prop2 }) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{prop1}</h2>
      <p>{prop2}</p>
    </div>
  );
}
```

#### State Management (Zustand)

```javascript
import { create } from 'zustand';

export const useMyStore = create((set, get) => ({
  data: [],
  loading: false,
  
  fetchData: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/my-endpoint', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      set({ data, loading: false });
    } catch (error) {
      console.error('Error:', error);
      set({ loading: false });
    }
  }
}));
```

### Debugging

#### Backend Debugging

Add console logs (will appear in terminal):
```javascript
console.log('Debug info:', variable);
console.error('Error:', error);
```

View logs:
```bash
# Logs appear in terminal where dev:full is running
npm run dev:full
```

#### Frontend Debugging

Use browser DevTools:
- **Console**: View logs and errors
- **Network**: Inspect API requests
- **React DevTools**: Inspect component state

Add debug statements:
```javascript
console.log('Component rendered:', props);
console.table(data);
```

#### Database Debugging

Check database content:
```bash
# List all transactions
wrangler d1 execute avanta-coinmaster-dev --local \
  --command="SELECT * FROM transactions LIMIT 10"

# Check user count
wrangler d1 execute avanta-coinmaster-dev --local \
  --command="SELECT COUNT(*) as user_count FROM users"
```

### Hot Reload

- **Frontend**: Auto-reloads on file changes (Vite HMR)
- **Backend**: Requires restart after changes to `functions/` directory

To auto-restart backend on changes:
```bash
# Install nodemon
npm install -g nodemon

# Watch and restart
nodemon --watch functions --exec "npm run dev:full"
```

## Common Development Tasks

### Adding a New Database Table

1. Create migration file:
```sql
-- migrations/052_add_new_table.sql
CREATE TABLE IF NOT EXISTS my_table (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_my_table_user_id ON my_table(user_id);
```

2. Apply migration:
```bash
wrangler d1 migrations apply avanta-coinmaster-dev --local
```

3. Update `DATABASE_TRACKING_SYSTEM.md`

### Adding a New API Endpoint

1. Create endpoint file
2. Implement handlers (GET, POST, PUT, DELETE)
3. Add authentication check
4. Add validation
5. Test locally
6. Create tests
7. Update API documentation

### Updating OpenAPI Documentation

After adding/modifying endpoints:

1. Update `docs/api/openapi.yaml`
2. Add new paths and schemas
3. Update examples
4. Test in Swagger UI: open `docs/api/index.html`

### Creating API Tests

```javascript
// tests/api/my-endpoint.test.js
import { describe, it, expect, beforeAll } from 'vitest';

describe('My Endpoint', () => {
  let token;
  
  beforeAll(async () => {
    // Register test user
    const registerResponse = await fetch('http://localhost:8788/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPass123!',
        name: 'Test User'
      })
    });
    const registerData = await registerResponse.json();
    token = registerData.token;
  });
  
  it('should create item', async () => {
    const response = await fetch('http://localhost:8788/api/my-endpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Test Item' })
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.name).toBe('Test Item');
  });
});
```

## Environment Configuration

### Development Environment

`.env.development`:
```env
JWT_SECRET=dev-secret-key
ENVIRONMENT=development
APP_VERSION=1.0.0-dev
```

### Production Environment

Set in Cloudflare Workers dashboard or via wrangler:
```bash
wrangler secret put JWT_SECRET
wrangler secret put ENVIRONMENT
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# Kill process on port 8788 (backend)
lsof -ti:8788 | xargs kill -9
```

### Database Issues

```bash
# Reset local database
rm -rf .wrangler/state
wrangler d1 migrations apply avanta-coinmaster-dev --local
```

### Module Not Found

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run build
```

## IDE Setup

### VS Code

Recommended extensions:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "cloudflare.vscode-wrangler"
  ]
}
```

Settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Debugging Configuration

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

## Performance Tips

- Use pagination for large data sets
- Implement caching where appropriate
- Optimize database queries with indexes
- Use React.memo for expensive components
- Lazy load routes and components
- Minimize bundle size

## Security Checklist

- [ ] Never commit `.env` files
- [ ] Use environment variables for secrets
- [ ] Validate all user input
- [ ] Implement rate limiting
- [ ] Use parameterized SQL queries
- [ ] Add CORS headers appropriately
- [ ] Implement proper authentication
- [ ] Log security events

## Next Steps

1. Read the [API Guide](../api/API_GUIDE.md)
2. Explore example endpoints in `functions/api/`
3. Run existing tests: `npm run test`
4. Create your first endpoint
5. Join the developer community

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)

---

**Questions?** Check the [Troubleshooting Guide](TROUBLESHOOTING.md) or open an issue on GitHub.
