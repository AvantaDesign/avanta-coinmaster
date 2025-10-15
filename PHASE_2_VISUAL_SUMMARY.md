# Phase 2: Credits and Debts Module - Visual Summary

## 🎨 UI Components Created

### 1. Credits Page (`/credits`)
```
┌─────────────────────────────────────────────────────────────┐
│ Créditos y Deudas                                           │
│ Gestiona tus tarjetas de crédito, préstamos e hipotecas    │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│ │ Saldo    │  │ Crédito  │  │ Utiliza- │                  │
│ │ Total    │  │ Disponib.│  │ ción     │                  │
│ │ $50,000  │  │ $25,000  │  │ 66.7%    │                  │
│ └──────────┘  └──────────┘  └──────────┘                  │
├─────────────────────────────────────────────────────────────┤
│ [Filtro: Todos] [Ordenar: Nombre] [+ Agregar Crédito]     │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│ │ BBVA Platino  │ │ Santander     │ │ Hipoteca      │    │
│ │ 💳 Crédito    │ │ 💳 Crédito    │ │ 🏠 Hipoteca   │    │
│ │               │ │               │ │               │    │
│ │ Saldo: $33,333│ │ Saldo: $8,000 │ │ Saldo: $850k  │    │
│ │ Límite: $50k  │ │ Límite: $30k  │ │ Tasa: 8.5%    │    │
│ │ Disp: $16,667 │ │ Disp: $22,000 │ │               │    │
│ │               │ │               │ │               │    │
│ │ Pago: 5 días  │ │ Pago: 12 días │ │ Pago: 1 día   │    │
│ │ [⚠️ 5 días]   │ │               │ │ [🔴 ¡URG!]    │    │
│ └───────────────┘ └───────────────┘ └───────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 2. Credit Card Component
```
┌─────────────────────────────────────────┐
│ 🎨 BBVA Platino                    [⋮] │ ← Action menu
│ 💳 Tarjeta de Crédito                  │
│                                         │
│ Saldo Actual                            │
│ $33,333.33                              │
│                                         │
│ Límite: $50,000    Disponible: $16,667 │
│                                         │
│ Utilización ▓▓▓▓▓▓░░░░ 66.7%          │
│                                         │
│ Próximo Pago: 5 Nov 2025 (5 días)     │
│ Tasa de Interés: 24.00% anual          │
└─────────────────────────────────────────┘
       [⚠️ 5 días]  ← Warning badge
```

### 3. Upcoming Payments Widget (Dashboard)
```
┌─────────────────────────────────────────────────────┐
│ Próximos Pagos               [2 vencidos] [1 urgente]│
├─────────────────────────────────────────────────────┤
│ 🔴 BBVA Platino                    Saldo: $33,333   │
│    ⏰ Vence: 5 Nov 2025                             │
│    🔴 ¡Atrasado 2 días!             Mín: $667      │
│    [💰 Registrar Pago]                              │
├─────────────────────────────────────────────────────┤
│ 🟠 Santander                       Saldo: $8,000    │
│    ⏰ Vence: 8 Nov 2025                             │
│    🟠 ¡Vence en 3 días!             Mín: $160      │
│    [💰 Registrar Pago]                              │
├─────────────────────────────────────────────────────┤
│ 🟡 Hipoteca Infonavit              Saldo: $850,000 │
│    ⏰ Vence: 15 Nov 2025                            │
│    🟡 10 días restantes             Mín: $17,000   │
│    [💰 Registrar Pago]                              │
├─────────────────────────────────────────────────────┤
│ Total a pagar en 30 días: $891,333                 │
│ Pagos mínimos totales: $17,827                     │
└─────────────────────────────────────────────────────┘
```

### 4. Add Movement Form
```
┌─────────────────────────────────────────┐
│ Agregar Movimiento - BBVA Platino      │
│ Saldo actual: $33,333.33                │
├─────────────────────────────────────────┤
│ Tipo de Movimiento *                    │
│ ┌─────┐ ┌─────┐ ┌─────┐               │
│ │ Pago│ │Cargo│ │Inter│               │
│ └─────┘ └─────┘ └─────┘               │
│                                         │
│ Descripción *                           │
│ [Pago mensual de noviembre           ] │
│                                         │
│ Monto *                                 │
│ $ [2500.00]                            │
│ Nuevo saldo: $30,833.33 ✅             │
│                                         │
│ Fecha *                                 │
│ [2025-11-05]                           │
│                                         │
│ ☑️ Crear transacción de gasto          │
│ Se creará automáticamente una          │
│ transacción de tipo "gasto"            │
│                                         │
│        [Cancelar] [💾 Guardar]        │
└─────────────────────────────────────────┘
```

### 5. Credit Details Modal
```
┌─────────────────────────────────────────────────────────────┐
│ BBVA Platino                                           [✕]  │
│ 💳 Tarjeta de Crédito                                      │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│ │ Saldo    │  │ Crédito  │  │ Límite   │                  │
│ │ Actual   │  │ Disponib.│  │ Total    │                  │
│ │ $33,333  │  │ $16,667  │  │ $50,000  │                  │
│ └──────────┘  └──────────┘  └──────────┘                  │
├─────────────────────────────────────────────────────────────┤
│ Tasa de Interés: 24.00% anual                              │
│ Día de Corte: Día 20 de cada mes                          │
│ Día de Pago: Día 5 de cada mes                            │
│ Próximo Pago: 5 Nov 2025 (5 días)                         │
├─────────────────────────────────────────────────────────────┤
│ [+ Agregar Movimiento] [✏️ Editar]                         │
├─────────────────────────────────────────────────────────────┤
│ Movimientos (24)            [Filtro ▼] [Ordenar ▼]        │
├─────────────────────────────────────────────────────────────┤
│ Total Pagos: $45,000  Cargos: $78,333  Interés: $0        │
├─────────────────────────────────────────────────────────────┤
│ 🟢 Pago        5 Nov 2025                        -$2,500   │
│    Pago mensual de noviembre                               │
├─────────────────────────────────────────────────────────────┤
│ 🟠 Cargo       3 Nov 2025                        +$1,250   │
│    Compra en Amazon                                        │
├─────────────────────────────────────────────────────────────┤
│ 🟠 Cargo       1 Nov 2025                          +$850   │
│    Supermercado                                            │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 User Flow Diagrams

### Creating a Credit
```
Dashboard/Credits Page
        ↓
Click [+ Agregar Crédito]
        ↓
Fill Credit Form
  - Name: "BBVA Platino"
  - Type: Credit Card
  - Limit: $50,000
  - Interest: 24%
  - Statement Day: 20
  - Payment Day: 5
        ↓
Click [Crear Crédito]
        ↓
API: POST /api/credits
        ↓
Credit Created ✅
        ↓
Redirect to Credits List
```

### Adding a Payment
```
Credits Page
        ↓
Click Credit Card [⋮] Menu
        ↓
Select "Agregar Movimiento"
        ↓
Fill Movement Form
  - Type: Payment
  - Description: "Pago mensual"
  - Amount: $2,500
  - Date: Today
  - ☑️ Create Transaction
        ↓
Click [Guardar]
        ↓
API: POST /api/credits/:id/movements
  + POST /api/transactions (if checked)
        ↓
Movement Created ✅
Balance Updated ✅
Transaction Created ✅
        ↓
Back to Credits List
```

### Dashboard Payment Flow
```
Home Dashboard
        ↓
View Upcoming Payments Widget
        ↓
See "BBVA Platino - ¡Vence en 3 días!"
        ↓
Click [Registrar Pago]
        ↓
Navigate to /credits
        ↓
Open Payment Form for BBVA
        ↓
Complete Payment
```

## 📊 Data Flow Architecture

```
┌─────────────┐
│   Browser   │
│  (React UI) │
└──────┬──────┘
       │ HTTP + JWT
       ↓
┌─────────────┐
│  Cloudflare │
│   Worker    │ ← functions/_worker.js
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Credits   │
│  API Module │ ← functions/api/credits.js
└──────┬──────┘
       │ SQL
       ↓
┌─────────────┐
│ D1 Database │
│   SQLite    │
├─────────────┤
│  credits    │ ← Credit records
│  credit_    │ ← Movement records
│  movements  │
└─────────────┘
```

## 🎯 Key Features Visual

### Balance Calculation
```
Credits Table:
┌────────┬──────┬────────┐
│ Name   │ Type │ Limit  │
├────────┼──────┼────────┤
│ BBVA   │ CC   │ $50k   │
└────────┴──────┴────────┘

Credit Movements:
┌────────┬────────┬────────┬────────┐
│ Type   │ Amount │ Date   │ Credit │
├────────┼────────┼────────┼────────┤
│ Charge │ +$5000 │ Nov 1  │ BBVA   │
│ Charge │ +$3000 │ Nov 2  │ BBVA   │
│ Payment│ -$2000 │ Nov 3  │ BBVA   │
│ Interest│+$333  │ Nov 4  │ BBVA   │
└────────┴────────┴────────┴────────┘

Calculation:
  Balance = (Charges + Interest) - Payments
          = ($5000 + $3000 + $333) - $2000
          = $6,333

Available = Limit - Balance
          = $50,000 - $6,333
          = $43,667

Utilization = (Balance / Limit) × 100
            = ($6,333 / $50,000) × 100
            = 12.7%
```

### Payment Due Date Logic
```
Today: November 5, 2025
Payment Due Day: 15

Next Payment Date:
  If today < 15: November 15, 2025
  If today ≥ 15: December 15, 2025

Days Until Payment:
  = Next Payment Date - Today
  = November 15 - November 5
  = 10 days

Urgency Level:
  < 0 days   → 🔴 Overdue
  0-3 days   → 🟠 Urgent
  4-7 days   → 🟡 Soon
  > 7 days   → 🟢 Normal
```

## 🏗️ Component Hierarchy

```
App.jsx
└── Home.jsx
    ├── BalanceCard
    ├── MonthlyChart
    ├── UpcomingPayments ← NEW!
    │   └── [Credit Payment Items]
    └── TransactionTable

App.jsx
└── Credits.jsx ← NEW!
    ├── Summary Cards
    ├── Toolbar
    │   ├── Filter Dropdown
    │   └── Sort Dropdown
    ├── CreditCard[] ← NEW!
    │   ├── Action Menu
    │   └── Warning Badge
    ├── CreditFormModal
    │   └── Form Fields
    ├── CreditMovementForm ← NEW!
    │   └── Movement Type Buttons
    └── CreditDetails ← NEW!
        ├── Summary Cards
        ├── Details Grid
        └── Movements List
```

## 📈 Database Schema Visual

```
┌─────────────────────────────────────┐
│            users                    │
├─────────────────────────────────────┤
│ id (PK)                             │
│ email                               │
│ name                                │
└─────────────────┬───────────────────┘
                  │
                  │ 1:N
                  ↓
┌─────────────────────────────────────┐
│           credits                   │
├─────────────────────────────────────┤
│ id (PK)                             │
│ user_id (FK) ────────────────────┐ │
│ name                             │ │
│ type                             │ │
│ credit_limit                     │ │
│ interest_rate                    │ │
│ statement_day                    │ │
│ payment_due_day                  │ │
│ is_active                        │ │
└──────────┬──────────────────────┘ │
           │                          │
           │ 1:N                      │
           ↓                          │
┌─────────────────────────────────────┐
│       credit_movements              │
├─────────────────────────────────────┤
│ id (PK)                             │
│ credit_id (FK) ───────────────────┘│
│ transaction_id (FK) ────────────┐  │
│ description                     │  │
│ amount                          │  │
│ type (payment/charge/interest)  │  │
│ date                            │  │
└──────────┬──────────────────────┘  │
           │                          │
           │ 0:1                      │
           ↓                          │
┌─────────────────────────────────────┐
│        transactions                 │
├─────────────────────────────────────┤
│ id (PK) ────────────────────────────┘
│ user_id (FK)
│ date
│ description
│ amount
│ type (ingreso/gasto)
└─────────────────────────────────────┘
```

## 🎨 Color Scheme

### Credit Card Gradients
- **Credit Card:** `from-blue-500 to-blue-700` 🔵
- **Loan:** `from-green-500 to-green-700` 🟢
- **Mortgage:** `from-purple-500 to-purple-700` 🟣

### Urgency Colors
- **Overdue:** `bg-red-600 text-white` 🔴
- **Urgent (0-3 days):** `bg-orange-500 text-white` 🟠
- **Soon (4-7 days):** `bg-yellow-500 text-white` 🟡
- **Normal (>7 days):** `bg-green-500 text-white` 🟢

### Movement Types
- **Payment:** `bg-green-100 text-green-800` ✅
- **Charge:** `bg-orange-100 text-orange-800` 🔸
- **Interest:** `bg-red-100 text-red-800` 📈

## 📱 Responsive Design

### Desktop (≥1024px)
```
┌──────────────────────────────────────┐
│ [Summary Cards: 3 columns]          │
├──────────────────────────────────────┤
│ [Credits Grid: 3 columns]            │
│ ┌────┐ ┌────┐ ┌────┐               │
│ │ CC │ │ CC │ │ CC │               │
│ └────┘ └────┘ └────┘               │
└──────────────────────────────────────┘
```

### Tablet (768px-1023px)
```
┌──────────────────────────┐
│ [Summary: 2 columns]     │
├──────────────────────────┤
│ [Credits: 2 columns]     │
│ ┌────┐ ┌────┐           │
│ │ CC │ │ CC │           │
│ └────┘ └────┘           │
└──────────────────────────┘
```

### Mobile (<768px)
```
┌────────────────┐
│ [Summary: 1 col]│
├────────────────┤
│ [Credits: 1 col]│
│ ┌────────────┐ │
│ │     CC     │ │
│ └────────────┘ │
│ ┌────────────┐ │
│ │     CC     │ │
│ └────────────┘ │
└────────────────┘
```

## 🚀 Performance Optimizations

### API Level
- Balance calculated only when `include_balance=true`
- Pagination support for large datasets
- Efficient SQL queries with proper indexes
- Conditional loading of movements

### Frontend Level
- Lazy loading of credit details
- Conditional rendering of widgets
- Optimized re-renders with React hooks
- Efficient state management

---

**Created:** October 15, 2025  
**Project:** Avanta Finance Phase 2  
**Total Components:** 4 major + 3 modals/forms  
**Total API Endpoints:** 7  
**Database Tables:** 2  
**Lines of Code:** ~3,375
