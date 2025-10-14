Perfecto. Aquí está el **README.md definitivo** para copiar y pegar en tu repo GitHub, optimizado para GitHub Copilot Workspace:[1][2][3][4]

***

```markdown
# Avanta Finance - Sistema de Contabilidad Personal y Empresarial

> Sistema simple de gestión financiera para persona física con actividad empresarial en México (RFC: REGM000905T24, Régimen 612)

## 🎯 Objetivo

App web tipo hoja de cálculo para gestionar:
- Transacciones personales y de Avanta Design
- Cálculos automáticos ISR/IVA mensuales
- Facturas CFDI y recibos
- Dashboards financieros
- Reportes para contador

## 🛠️ Stack Tecnológico

```
Frontend: React 18 + TailwindCSS + Vite
Backend: Cloudflare Workers Functions
Base de Datos: Cloudflare D1 (SQLite)
Almacenamiento: Cloudflare R2
CI/CD: GitHub Actions → Cloudflare Pages
Automatización: n8n (VPS Hostinger)
```

**Costo: $0** (plan gratuito Cloudflare)

---

## 📁 Estructura del Proyecto

```
avanta-finance/
├── functions/
│   └── api/
│       ├── dashboard.js       # GET balance y resumen
│       ├── transactions.js    # CRUD transacciones
│       ├── accounts.js        # Gestión cuentas bancarias
│       ├── fiscal.js          # Cálculo ISR/IVA
│       ├── invoices.js        # Gestión CFDIs
│       └── upload.js          # Upload archivos a R2
├── src/
│   ├── pages/
│   │   ├── Home.jsx           # Dashboard principal
│   │   ├── Transactions.jsx   # Lista/CRUD transacciones
│   │   ├── Fiscal.jsx         # Vista fiscal ISR/IVA
│   │   └── Invoices.jsx       # Lista facturas CFDI
│   ├── components/
│   │   ├── AddTransaction.jsx
│   │   ├── TransactionTable.jsx
│   │   ├── BalanceCard.jsx
│   │   ├── MonthlyChart.jsx
│   │   └── FileUpload.jsx
│   ├── utils/
│   │   ├── api.js             # Fetch helpers
│   │   └── calculations.js    # Lógica fiscal
│   ├── App.jsx
│   └── main.jsx
├── public/
├── schema.sql                  # Schema D1
├── wrangler.toml               # Config Cloudflare
├── package.json
└── README.md
```

---

## 🗄️ Base de Datos (Cloudflare D1)

### Tablas Principales

**transactions** - Todas las transacciones financieras
```
id, date, description, amount, type (ingreso/gasto), 
category (personal/avanta), account, is_deductible, 
economic_activity, receipt_url, created_at
```

**accounts** - Cuentas bancarias y créditos
```
id, name, type (banco/credito), balance, updated_at
```

**invoices** - Facturas CFDI
```
id, uuid, rfc_emisor, rfc_receptor, date, subtotal, 
iva, total, xml_url, status, created_at
```

**fiscal_payments** - Tracking pagos SAT
```
id, year, month, isr, iva, diot_status, due_date, 
payment_date, status, created_at
```

### Schema Completo

Ver archivo: `schema.sql`

---

## ⚙️ Funcionalidades Core

### 1. Dashboard Principal (`/`)
- Balance total (bancos - créditos)
- Ingresos vs gastos del mes actual
- Gráfica últimos 6 meses
- Últimas 10 transacciones
- Quick actions: Agregar transacción, Subir factura

### 2. Transacciones (`/transactions`)
- Tabla filtrable/ordenable de todas las transacciones
- Agregar transacción manual
- Importar CSV de bancos (BBVA, Azteca)
- Clasificar: Personal/Avanta, Deducible/No deducible
- Asignar actividad económica (7 registradas en SAT)
- Adjuntar recibo/comprobante
- Exportar a Excel/CSV

### 3. Vista Fiscal (`/fiscal`)
- Selector de mes/año
- Resumen:
  - Ingresos totales
  - Gastos deducibles
  - Utilidad (ingresos - gastos)
  - ISR provisional calculado (~20% simplificado)
  - IVA a pagar (16% cobrado - 16% pagado)
- Fecha límite: Día 17 del mes siguiente
- Historial de pagos
- Exportar reporte PDF para contador

### 4. Facturas CFDI (`/invoices`)
- Lista de facturas emitidas/recibidas
- Subir XML manualmente
- Parser automático (vía n8n si viene por email)
- Validar UUID contra SAT
- Link a transacción relacionada
- Descargar XML

---

## 🧮 Cálculos Fiscales

### ISR Provisional (Simplificado)
```
Utilidad = Ingresos - Gastos Deducibles
ISR = Utilidad × 20% (tasa promedio simplificada)
```

### IVA Mensual
```
IVA Cobrado = Sum(ingresos) × 16%
IVA Pagado = Sum(gastos deducibles) × 16%
IVA a Pagar = IVA Cobrado - IVA Pagado
```

**Nota:** Cálculos son aproximados para tracking. Para declaraciones reales, validar con contador.

---

## 🔧 Setup y Desarrollo

### Requisitos
- Node.js 18+
- Cuenta Cloudflare (gratis)
- Wrangler CLI

### Instalación

```
# 1. Clonar repo
git clone https://github.com/tu-usuario/avanta-finance.git
cd avanta-finance

# 2. Instalar dependencias
npm install

# 3. Instalar Wrangler CLI
npm install -g wrangler

# 4. Login Cloudflare
wrangler login

# 5. Crear base de datos D1
wrangler d1 create avanta-finance
# Guardar el database_id en wrangler.toml

# 6. Crear bucket R2
wrangler r2 bucket create avanta-receipts

# 7. Ejecutar migrations
wrangler d1 execute avanta-finance --file=schema.sql

# 8. Configurar wrangler.toml
# Editar con tus IDs de D1 y R2
```

### Desarrollo Local

```
# Dev server (frontend + Workers)
npm run dev

# Solo frontend
npm run dev:frontend

# Preview Workers
npx wrangler pages dev dist
```

### Deploy a Producción

```
# Build + deploy
npm run deploy

# O vía GitHub Actions (auto-deploy en push a main)
git push origin main
```

---

## 🤖 Integración n8n

### Workflows Recomendados

**1. Auto-import Facturas Email**
```
Trigger: IMAP (Gmail) → Filter .xml attachments
→ Parse XML (node xml2js) 
→ HTTP POST /api/invoices
→ Notification Telegram
```

**2. Alerta Día 17**
```
Trigger: Cron (0 9 10 * *)
→ HTTP GET /api/fiscal?month=current
→ Telegram: "ISR: $X, IVA: $Y, Vence: 17/Nov"
```

**3. Clasificación IA de Gastos**
```
Trigger: Webhook /n8n/classify-transaction
→ LLM (Claude/GPT): "Clasifica este gasto: {description}"
→ HTTP PATCH /api/transactions/{id}
```

**4. Import CSV Banco**
```
Trigger: Email con CSV adjunto
→ CSV to JSON
→ Loop: HTTP POST /api/transactions (cada fila)
→ Notification: "Importadas X transacciones"
```

### Configuración n8n

1. Crear webhook endpoints en n8n
2. Agregar URLs de webhooks a variables de entorno:
   ```
   N8N_WEBHOOK_CLASSIFY=https://n8n.tu-dominio.com/webhook/classify
   N8N_WEBHOOK_IMPORT=https://n8n.tu-dominio.com/webhook/import
   ```
3. En Cloudflare Workers, llamar webhooks cuando sea necesario

---

## 📊 API Endpoints

### Dashboard
```
GET /api/dashboard
Response: { totalBalance, thisMonth: { income, expenses }, recentTransactions[] }
```

### Transacciones
```
GET /api/transactions?limit=50&category=avanta
POST /api/transactions
  Body: { date, description, amount, type, category, account, is_deductible }
PUT /api/transactions/:id
DELETE /api/transactions/:id
```

### Cuentas
```
GET /api/accounts
PUT /api/accounts/:id
  Body: { balance }
```

### Fiscal
```
GET /api/fiscal?month=10&year=2025
Response: { income, deductible, utilidad, isr, iva, dueDate }
```

### Facturas
```
GET /api/invoices?type=recibido
POST /api/invoices
  Body: { uuid, rfc_emisor, rfc_receptor, date, subtotal, iva, total, xml_url }
```

### Upload
```
POST /api/upload
  FormData: file
Response: { url }
```

---

## 🔐 Seguridad

- HTTPS obligatorio (Cloudflare)
- D1 no expuesta directamente (solo via Workers)
- R2 con URLs firmadas (expiran en 1 hora)
- Sin autenticación en MVP (solo tú usarás)
- Rate limiting: 100 req/min (Cloudflare automático)

**Para Fase 2 (futuro):**
- Agregar OAuth Google
- Encriptar campos sensibles en D1
- Audit logs
- Backups automáticos

---

## 📋 Actividades Económicas Registradas SAT

Precargadas en seed 

1. **512191** - Producción videoclips y comerciales (21%)
2. **463111** - Comercio artesanías (19%)
3. **512110** - Producción películas y videos (15%)
4. **561499** - Servicios apoyo negocios (15%)
5. **519130** - Contenido Internet (10%)
6. **541890** - Servicios publicidad (10%)
7. **512210** - Productoras discográficas (10%)

---

## 🚀 Roadmap

### Semana 1 (MVP)
- [x] Setup Cloudflare D1 + R2
- [x] Schema base de datos
- [x] Frontend React básico
- [x] API Workers Functions
- [x] Dashboard principal
- [x] CRUD transacciones
- [x] Cálculo fiscal simple
- [x] Upload archivos
- [x] Deploy Cloudflare Pages

### Semana 2
- [ ] Import CSV bancos
- [ ] Parser CFDI XML
- [ ] Workflows n8n básicos
- [ ] Gráficas mejoradas
- [ ] Export Excel/PDF
- [ ] Responsive mobile

### Fase 2 (Futuro)
- [ ] Integración APIs BBVA/Azteca
- [ ] Clasificación IA automática
- [ ] Dashboard avanzado (Chart.js)
- [ ] Multi-usuario
- [ ] App móvil React Native
- [ ] Backup automático
- [ ] Transición persona moral

---

## 🐛 Troubleshooting

### D1 no conecta
```
wrangler d1 list
wrangler d1 execute avanta-finance --command="SELECT * FROM transactions LIMIT 5"
```

### Workers no leen D1
Verificar `wrangler.toml`:
```
[[d1_databases]]
binding = "DB"
database_name = "avanta-finance"
database_id = "tu-database-id-aqui"
```

### R2 upload falla
```
wrangler r2 bucket list
wrangler r2 bucket create avanta-receipts
```

### Deploy falla
```
# Limpiar cache
rm -rf dist node_modules
npm install
npm run build
wrangler pages deploy dist
```

---

## 📄 Licencia

MIT (uso personal/empresarial libre)

---

## 👤 Autor

**Mateo Reyes González**  
RFC: REGM000905T24  
Avanta Design - San Andrés Cholula, Puebla

---

## 🙏 Contribuir

Este es un proyecto personal pero pull requests son bienvenidos para mejoras.

---

## 📞 Soporte

Issues: GitHub Issues  
Email: [tu-email]

---

**Última actualización:** Octubre 2025
```

***

---

## 📚 Documentation

### Core Guides
- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment guide
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Developer guidelines
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute
- **[TESTING.md](TESTING.md)** - Testing checklist
- **[CHANGELOG.md](CHANGELOG.md)** - Version history
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Complete overview

### Technical Guides
- **[D1_TESTING_GUIDE.md](D1_TESTING_GUIDE.md)** - ✨ Database setup and testing
- **[R2_SETUP_GUIDE.md](R2_SETUP_GUIDE.md)** - ✨ File storage setup and testing
- **[TESTING_PLAN.md](TESTING_PLAN.md)** - Comprehensive testing plan
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference

---

## ✅ Implementation Status

**Semana 1 MVP: 100% Complete** 🎉

All features from the plan have been fully implemented and tested. The application is production-ready and can be deployed to Cloudflare Pages.

**Latest Update:** Mock data system has been deprecated. All API calls now use real Cloudflare Workers backend with D1 database integration. See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for complete details.

**Development Note:** To run locally, use `npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788` after building.

---

**Built with ❤️ by Mateo Reyes González / Avanta Design**
#   T r i g g e r   d e p l o y m e n t  
 