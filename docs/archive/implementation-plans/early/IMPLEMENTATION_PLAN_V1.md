# Plan de Implementación Integral: Avanta Finance

**Documento Creado:** 14 de Octubre de 2025
**Autor:** Gemini AI
**Versión:** 1.0

## 1. Resumen Ejecutivo

Este documento detalla el plan de acción para evolucionar "Avanta Finance" a un sistema financiero integral y robusto, diseñado específicamente para el perfil de **Persona Física con Actividad Empresarial** en México.

El objetivo es implementar funcionalidades críticas, refactorizar la arquitectura técnica para asegurar escalabilidad y mantenibilidad, y fortalecer la seguridad del sistema. Las prioridades se han establecido para entregar valor de forma incremental, comenzando por los cambios más fundamentales.

**Nota Clave sobre la Lógica Fiscal:** Se entiende que, como Persona Física, el ISR anual considera la totalidad de los ingresos. Sin embargo, para los cálculos de pagos provisionales y la correcta contabilidad del negocio, es indispensable **distinguir entre gastos/ingresos de la actividad empresarial y los gastos/ingresos personales**. El sistema permitirá esta clasificación para que los cálculos fiscales (deducciones) se apliquen correctamente sobre la base del negocio, mientras que los reportes de salud financiera personal puedan mostrar una visión consolidada.

---

## 2. Fases de Implementación

### Fase 0: Seguridad y Autenticación (Prioridad Bloqueante)

*No se debe proceder con otras fases si el sistema manejará datos reales sin una capa de seguridad.*

**Objetivo:** Proteger el acceso a la aplicación y asegurar que cada usuario solo pueda ver y gestionar sus propios datos.

- **[ ] Tarea 0.1: Implementar Autenticación de Usuarios**
    - **Opción A (Recomendada):** Utilizar **Cloudflare Access** en conjunto con un proveedor de identidad (Google, GitHub, etc.). Es la opción más integrada con el ecosistema actual.
    - **Opción B:** Integrar un servicio como **Auth0** o **Clerk**.
    - **Resultado:** La aplicación tendrá una pantalla de login y solo los usuarios autenticados podrán acceder.

- **[ ] Tarea 0.2: Modificar Esquema de Base de Datos para Multi-tenancy**
    - **Acción:** Añadir una columna `user_id` (TEXT NOT NULL) a todas las tablas que contienen datos del usuario.
    - **Tablas Afectadas:** `accounts`, `transactions`, `categories`, `invoices`, y todas las nuevas tablas que se creen.
    - **Ejemplo (`schema.sql`):**
      ```sql
      CREATE TABLE accounts (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          balance REAL NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      ```

- **[ ] Tarea 0.3: Asegurar Endpoints de la API**
    - **Acción:** En cada función del backend (`/functions/api/**/*.js`), validar el token de autenticación (JWT) del usuario.
    - **Lógica:** Extraer el `user_id` del token validado.
    - **Acción:** Modificar todas las consultas SQL para que incluyan una cláusula `WHERE user_id = ?`.
    - **Ejemplo (en `functions/api/accounts.js`):**
      ```javascript
      // Antes
      const { results } = await env.DB.prepare("SELECT * FROM accounts").all();

      // Después
      const userId = await getUserIdFromToken(request); // Función a implementar
      const { results } = await env.DB.prepare("SELECT * FROM accounts WHERE user_id = ?").bind(userId).all();
      ```

---

### Fase 1: Lógica de Negocio vs. Personal (Prioridad Fundacional)

**Objetivo:** Implementar la capacidad de clasificar transacciones como "Negocio" o "Personal" para permitir cálculos fiscales correctos y una visión financiera clara.

- **[ ] Tarea 1.1: Modificar Esquema de la Base de Datos**
    - **Acción:** Añadir una columna `classification` a la tabla `transactions`.
    - **Ejemplo (`schema.sql`):**
      ```sql
      ALTER TABLE transactions ADD COLUMN classification TEXT NOT NULL DEFAULT 'personal' CHECK(classification IN ('business', 'personal'));
      ```
    - **Acción:** Crear una migración en `/migrations` para aplicar este cambio.

- **[ ] Tarea 1.2: Actualizar Backend API**
    - **Endpoint:** `POST /api/transactions`, `PUT /api/transactions/:id`
    - **Acción:** Modificar los endpoints para que acepten y validen el nuevo campo `classification`.

- **[ ] Tarea 1.3: Actualizar UI del Frontend**
    - **Componente:** `AddTransaction.jsx`
    - **Acción:** Añadir un `ToggleButton` o `Select` para que el usuario elija entre "Personal" y "Negocio" al crear o editar una transacción.
    - **Componente:** `TransactionTable.jsx`
    - **Acción:** Añadir una columna o un indicador visual (ej. una etiqueta de color) para mostrar la clasificación.
    - **Acción:** Añadir un control de filtro para que el usuario pueda ver "Todas", "Personales" o "De Negocio".

- **[ ] Tarea 1.4: Adaptar Lógica de Cálculos y Reportes**
    - **Componentes:** `FiscalCalculator.jsx`, `FinancialDashboard.jsx`, `AdvancedReports.jsx`
    - **Acción:** Modificar la lógica de obtención y procesamiento de datos para que utilice el filtro de `classification`.
    - **Ejemplo:** El `FiscalCalculator` **solo** debe usar transacciones con `classification = 'business'` para calcular la base gravable de ISR y el IVA acreditable/trasladado. El `FinancialDashboard` puede tener vistas separadas o combinadas.

---

### Fase 2: Módulo Integral de Créditos y Deudas

**Objetivo:** Añadir la funcionalidad para gestionar créditos, deudas, fechas de corte y fechas de pago.

- **[ ] Tarea 2.1: Crear Nuevas Tablas en la Base de Datos**
    - **Acción:** Añadir las tablas `credits` y `credit_movements` a `schema.sql` y crear la migración correspondiente.
    - **Esquema `credits`:**
      ```sql
      CREATE TABLE credits (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('credit_card', 'loan', 'mortgage')),
          credit_limit REAL,
          interest_rate REAL,
          statement_day INTEGER, -- Día del mes para el corte
          payment_due_day INTEGER, -- Día del mes para el pago
          is_active BOOLEAN DEFAULT TRUE
      );
      ```
    - **Esquema `credit_movements`:**
      ```sql
      CREATE TABLE credit_movements (
          id TEXT PRIMARY KEY,
          credit_id TEXT NOT NULL,
          transaction_id TEXT, -- Opcional: para ligar al pago desde una cuenta
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('payment', 'charge', 'interest')),
          date TEXT NOT NULL,
          FOREIGN KEY(credit_id) REFERENCES credits(id)
      );
      ```

- **[ ] Tarea 2.2: Desarrollar Nuevos Endpoints en la API**
    - **Ruta:** `functions/api/credits.js`
    - **Endpoints:**
        - `GET /api/credits`: Listar todos los créditos.
        - `POST /api/credits`: Crear un nuevo crédito.
        - `GET /api/credits/:id/movements`: Ver los movimientos de un crédito.
        - `POST /api/credits/:id/movements`: Registrar un nuevo movimiento (ej. un pago).

- **[ ] Tarea 2.3: Construir la UI del Módulo de Créditos**
    - **Nueva Página:** `src/pages/Credits.jsx`. Permitirá ver la lista de créditos, su saldo actual y administrar los movimientos.
    - **Nuevos Componentes:**
        - `CreditCard.jsx`: Un componente visual para mostrar la información de cada crédito.
        - `UpcomingPayments.jsx`: Un widget para el `FinancialDashboard.jsx` que alerte sobre las próximas fechas de pago.
    - **Integración:** Al registrar un pago a un crédito, se debe crear una transacción de tipo "gasto" en la cuenta bancaria correspondiente y un movimiento de tipo "pago" en el crédito.

---

### Fase 3: Mejoras Técnicas y Escalabilidad

**Objetivo:** Refactorizar el frontend para mejorar la gestión del estado y el rendimiento.

- **[ ] Tarea 3.1: Implementar un Gestor de Estado Global**
    - **Librería Recomendada:** **Zustand**.
    - **Acción:** Crear "stores" (almacenes de estado) para manejar datos globales.
    - **Ejemplos de Stores:**
        - `useTransactionStore`: Manejará la lista de transacciones, filtros, etc.
        - `useAccountStore`: Manejará las cuentas y sus saldos.
        - `useCreditStore`: Manejará los créditos y sus movimientos.
    - **Acción:** Refactorizar los componentes (`TransactionTable`, `FinancialDashboard`, etc.) para que consuman los datos desde estos stores en lugar de pasarlos por props (`prop drilling`).

- **[ ] Tarea 3.2: Optimizar el Rendimiento de Tablas Grandes**
    - **Componente:** `TransactionTable.jsx`
    - **Librería Recomendada:** **TanStack Virtual** (antes React Virtual).
    - **Acción:** Envolver la tabla de transacciones con un virtualizador para que solo se rendericen las filas visibles en pantalla. Esto es crucial para mantener la fluidez de la UI con miles de registros.

---

### Fase 4: Funcionalidades Avanzadas

**Objetivo:** Añadir características que completen la visión 360° del sistema financiero.

- **[ ] Tarea 4.1: Módulo de Presupuestos (Budgeting)**
    - **BD:** Crear tabla `budgets` (`id`, `user_id`, `category_id`, `classification`, `amount`, `period`).
    - **API:** Crear endpoints `GET /api/budgets` y `POST /api/budgets`.
    - **UI:** Crear página `src/pages/Budgets.jsx` para definir presupuestos mensuales por categoría (personal y de negocio).
    - **UI:** Integrar visualizaciones (ej. barras de progreso) en el dashboard y reportes para comparar gasto real vs. presupuestado.

- **[ ] Tarea 4.2: Mejoras al Módulo Fiscal**
    - **UI:** Crear una sección de "Configuración Fiscal" donde el usuario pueda actualizar las tablas de tasas de ISR anualmente.
    - **BD/API/UI:** Añadir un flag `is_deductible` a la tabla `categories`. La UI podría mostrar una sugerencia al categorizar un gasto de negocio.
    - **UI:** Crear una herramienta de "Simulación Fiscal" que proyecte el impuesto anual basándose en los datos actuales y proyecciones de ingresos/gastos.

- **[ ] Tarea 4.3: Reconciliación de Facturas (CFDI)**
    - **BD:** Crear tabla de unión `transaction_invoice_map` (`transaction_id`, `invoice_id`).
    - **UI:** En la vista de una transacción, permitir al usuario "ligar" una o más facturas (CFDIs) a esa transacción de pago/cobro.
    - **Componente:** Mejorar `ReconciliationManager.jsx` para usar esta relación explícita.

---

## 3. Cronograma Propuesto

| Fase | Descripción                               | Duración Estimada |
|------|-------------------------------------------|-------------------|
| 0    | Seguridad y Autenticación                 | 3-5 días          |
| 1    | Lógica de Negocio vs. Personal            | 4-6 días          |
| 2    | Módulo de Créditos                        | 5-8 días          |
| 3    | Mejoras Técnicas (Gestor Estado, Perf.)   | 5-7 días          |
| 4    | Funcionalidades Avanzadas (Budget, etc.)  | 8-12 días         |

*Las duraciones son estimaciones y pueden variar. Se recomienda abordar las fases en el orden numérico propuesto.*