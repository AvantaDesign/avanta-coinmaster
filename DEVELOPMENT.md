# Development Guide - Avanta Finance

This guide helps developers understand the codebase and contribute to Avanta Finance.

## Project Structure

```
avanta-finance/
├── functions/              # Cloudflare Workers Functions (Backend)
│   └── api/
│       ├── dashboard.js    # GET balance and summary
│       ├── transactions.js # CRUD for transactions
│       ├── accounts.js     # Manage bank accounts
│       ├── fiscal.js       # Calculate ISR/IVA
│       ├── invoices.js     # Manage CFDI invoices
│       └── upload.js       # File uploads to R2
│
├── src/                    # React Frontend
│   ├── pages/              # Main pages
│   │   ├── Home.jsx        # Dashboard with summary
│   │   ├── Transactions.jsx # Transaction list/CRUD
│   │   ├── Fiscal.jsx      # Tax calculations view
│   │   └── Invoices.jsx    # Invoice management
│   │
│   ├── components/         # Reusable components
│   │   ├── AddTransaction.jsx
│   │   ├── TransactionTable.jsx
│   │   ├── BalanceCard.jsx
│   │   ├── MonthlyChart.jsx
│   │   └── FileUpload.jsx
│   │
│   ├── utils/              # Utility functions
│   │   ├── api.js          # API client functions
│   │   └── calculations.js # Fiscal calculations
│   │
│   ├── App.jsx             # Main app with routing
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
│
├── public/                 # Static assets
├── schema.sql             # Database schema
├── wrangler.toml          # Cloudflare config
├── package.json           # Dependencies
└── vite.config.js         # Build config
```

## Technology Stack

### Frontend
- **React 18** - UI library
- **React Router 6** - Client-side routing
- **Tailwind CSS 3** - Utility-first CSS
- **Vite** - Build tool and dev server

### Backend
- **Cloudflare Workers** - Serverless functions
- **Cloudflare D1** - SQLite database
- **Cloudflare R2** - Object storage (S3-compatible)
- **Cloudflare Pages** - Static hosting + Functions

## Database Schema

### transactions
Primary table for all financial transactions.

```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('ingreso', 'gasto')),
    category TEXT NOT NULL CHECK(category IN ('personal', 'avanta')),
    account TEXT,
    is_deductible INTEGER DEFAULT 0 CHECK(is_deductible IN (0, 1)),
    economic_activity TEXT,
    receipt_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### accounts
Bank accounts and credit cards.

```sql
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('banco', 'credito')),
    balance REAL DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### invoices
CFDI invoices (Mexican electronic invoices).

```sql
CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    rfc_emisor TEXT NOT NULL,
    rfc_receptor TEXT NOT NULL,
    date TEXT NOT NULL,
    subtotal REAL NOT NULL,
    iva REAL NOT NULL,
    total REAL NOT NULL,
    xml_url TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### fiscal_payments
Track tax payments to SAT.

```sql
CREATE TABLE fiscal_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    isr REAL DEFAULT 0,
    iva REAL DEFAULT 0,
    diot_status TEXT DEFAULT 'pending',
    due_date TEXT NOT NULL,
    payment_date TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, month)
);
```

## API Endpoints

All endpoints are defined in `functions/api/*.js` files.

### GET /api/dashboard
Returns summary data for the dashboard.

**Response:**
```json
{
  "totalBalance": 50000.00,
  "thisMonth": {
    "income": 30000.00,
    "expenses": 15000.00
  },
  "recentTransactions": [...]
}
```

### GET/POST/PUT/DELETE /api/transactions
CRUD operations for transactions.

**POST body:**
```json
{
  "date": "2025-10-12",
  "description": "Venta de servicio",
  "amount": 5000.00,
  "type": "ingreso",
  "category": "avanta",
  "account": "BBVA",
  "is_deductible": false
}
```

### GET /api/fiscal?month=10&year=2025
Calculate ISR and IVA for a specific month.

**Response:**
```json
{
  "month": 10,
  "year": 2025,
  "income": 30000.00,
  "deductible": 8000.00,
  "utilidad": 22000.00,
  "isr": 4400.00,
  "iva": 3520.00,
  "dueDate": "2025-11-17"
}
```

## Fiscal Calculations

### ISR (Impuesto Sobre la Renta)
Simplified calculation at 20% rate:

```javascript
const utilidad = ingresos - gastosDeducibles;
const isr = utilidad > 0 ? utilidad * 0.20 : 0;
```

### IVA (Impuesto al Valor Agregado)
16% rate on all transactions:

```javascript
const ivaCobrado = ingresos * 0.16;
const ivaPagado = gastosDeducibles * 0.16;
const iva = ivaCobrado - ivaPagado;
```

**Note:** These are simplified calculations for personal tracking. Always consult with an accountant for official tax filings.

## Development Workflow

### 1. Setup

```bash
git clone https://github.com/AvantaDesign/avanta-coinmaster.git
cd avanta-coinmaster
npm install
```

### 2. Local Development

```bash
# Frontend only (fast, no Workers)
npm run dev

# Full stack (with Workers, slower)
npm run build
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts
```

### 3. Make Changes

- Edit files in `src/` for frontend changes
- Edit files in `functions/api/` for backend changes
- Edit `schema.sql` for database changes (then re-run migrations)

### 4. Test

```bash
npm run build  # Check for build errors
```

### 5. Commit and Push

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

## Adding New Features

### Add a New Page

1. Create component in `src/pages/NewPage.jsx`
2. Import and add route in `src/App.jsx`:
   ```jsx
   import NewPage from './pages/NewPage';
   // ...
   <Route path="/new-page" element={<NewPage />} />
   ```
3. Add navigation link in `src/App.jsx`

### Add a New API Endpoint

1. Create handler in `functions/api/endpoint.js`
2. Export `onRequestGet`, `onRequestPost`, etc.
3. Use in frontend via `src/utils/api.js`

Example:
```javascript
// functions/api/example.js
export async function onRequestGet(context) {
  const { env } = context;
  const result = await env.DB.prepare('SELECT * FROM table').all();
  return new Response(JSON.stringify(result.results), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Add a New Database Table

1. Update `schema.sql` with CREATE TABLE statement
2. Run migration:
   ```bash
   wrangler d1 execute avanta-finance --file=schema.sql
   ```

## Styling Guidelines

- Use Tailwind CSS utility classes
- Follow existing color scheme:
  - Blue: Primary actions
  - Green: Income/positive
  - Red: Expenses/negative
  - Purple: Invoices
  - Gray: Neutral/secondary

## Code Style

- Use functional components (no class components)
- Use React hooks for state management
- Keep components small and focused
- Extract reusable logic to utility functions
- Use async/await for API calls
- Handle errors gracefully

## Testing

Currently no automated tests (MVP phase). Manual testing checklist:

- [ ] Dashboard loads and shows correct data
- [ ] Can add transactions
- [ ] Can delete transactions
- [ ] Fiscal calculations are accurate
- [ ] Can add invoices
- [ ] File upload works
- [ ] Responsive on mobile

## Common Issues

### "Module not found"
```bash
npm install
```

### "D1 database not found" in development
Use frontend-only mode:
```bash
npm run dev
```

### Build fails
```bash
rm -rf node_modules dist
npm install
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m "Add new feature"`
6. Push: `git push origin feature/new-feature`
7. Open a Pull Request

## Resources

- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)

---

For deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).
