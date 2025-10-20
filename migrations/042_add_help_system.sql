-- Migration 042: Add Help System
-- Phase 38: Help Center and Onboarding Guide Expansion
-- Created: October 2025
--
-- This migration creates the infrastructure for the comprehensive help center
-- and onboarding system, including categorized articles, user progress tracking,
-- and feedback collection.

-- ============================================================================
-- HELP CATEGORIES TABLE
-- ============================================================================
-- Stores categories for organizing help articles
CREATE TABLE IF NOT EXISTS help_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT, -- Emoji or icon identifier
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_help_categories_slug ON help_categories(slug);
CREATE INDEX IF NOT EXISTS idx_help_categories_active ON help_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_help_categories_order ON help_categories(display_order);

-- ============================================================================
-- HELP ARTICLES TABLE
-- ============================================================================
-- Stores help articles with markdown content support
CREATE TABLE IF NOT EXISTS help_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    summary TEXT, -- Short description for search results
    content TEXT NOT NULL, -- Markdown formatted content
    tags TEXT, -- Comma-separated tags for search
    difficulty_level TEXT DEFAULT 'beginner' CHECK(difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_read_time INTEGER DEFAULT 5, -- Minutes
    is_featured INTEGER DEFAULT 0 CHECK(is_featured IN (0, 1)),
    is_published INTEGER DEFAULT 1 CHECK(is_published IN (0, 1)),
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0, -- User feedback: helpful votes
    not_helpful_count INTEGER DEFAULT 0, -- User feedback: not helpful votes
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES help_categories(id) ON DELETE CASCADE
);

-- Indexes for faster article lookups and search
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_help_articles_slug ON help_articles(slug);
CREATE INDEX IF NOT EXISTS idx_help_articles_featured ON help_articles(is_featured);
CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_help_articles_views ON help_articles(view_count);

-- Full-text search index for titles and content
CREATE INDEX IF NOT EXISTS idx_help_articles_title ON help_articles(title);

-- ============================================================================
-- USER ONBOARDING PROGRESS TABLE
-- ============================================================================
-- Tracks user progress through onboarding steps
CREATE TABLE IF NOT EXISTS user_onboarding_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    step_id TEXT NOT NULL, -- Identifier for the onboarding step
    step_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'skipped')),
    completed_at TEXT,
    skipped_at TEXT,
    metadata TEXT, -- JSON with step-specific data
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, step_id)
);

-- Indexes for progress tracking
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user ON user_onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_status ON user_onboarding_progress(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_step ON user_onboarding_progress(step_id);

-- ============================================================================
-- HELP FEEDBACK TABLE
-- ============================================================================
-- Stores user feedback on help articles and features
CREATE TABLE IF NOT EXISTS help_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    article_id INTEGER, -- Nullable for general feedback
    feedback_type TEXT NOT NULL CHECK(feedback_type IN ('helpful', 'not_helpful', 'suggestion', 'bug_report')),
    rating INTEGER CHECK(rating >= 1 AND rating <= 5), -- 1-5 star rating (optional)
    comment TEXT,
    page_url TEXT, -- URL where feedback was given
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES help_articles(id) ON DELETE CASCADE
);

-- Indexes for feedback queries
CREATE INDEX IF NOT EXISTS idx_help_feedback_user ON help_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_help_feedback_article ON help_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_help_feedback_type ON help_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_help_feedback_created ON help_feedback(created_at);

-- ============================================================================
-- INSERT DEFAULT HELP CATEGORIES
-- ============================================================================

INSERT INTO help_categories (name, slug, description, icon, display_order) VALUES
('Primeros Pasos', 'getting-started', 'Guía inicial para comenzar a usar Avanta Finance', '🚀', 1),
('Transacciones', 'transactions', 'Cómo registrar y gestionar tus transacciones', '💳', 2),
('Cuentas', 'accounts', 'Gestión de cuentas bancarias y saldos', '🏦', 3),
('Fiscal', 'fiscal', 'Cumplimiento fiscal y cálculos de impuestos', '📄', 4),
('Deducibilidad', 'deductibility', 'Deducibilidad fiscal y clasificación de gastos', '✅', 5),
('CFDI e Invoices', 'invoices', 'Gestión de facturas y comprobantes fiscales', '🧾', 6),
('Reportes', 'reports', 'Generación y análisis de reportes', '📊', 7),
('Tesorería', 'treasury', 'Flujo de efectivo y proyecciones', '💼', 8),
('Automatización', 'automation', 'Reglas automáticas y clasificación', '⚙️', 9),
('Interfaz', 'interface', 'Navegación y personalización de la interfaz', '🎨', 10);

-- ============================================================================
-- INSERT DEFAULT HELP ARTICLES
-- ============================================================================

-- Getting Started Articles
INSERT INTO help_articles (category_id, title, slug, summary, content, tags, difficulty_level, is_featured, display_order) VALUES
(1, '¿Cómo empiezo a usar Avanta Finance?', 'como-empezar', 'Guía completa para dar tus primeros pasos', '# ¿Cómo empiezo a usar Avanta Finance?

Bienvenido a Avanta Finance, tu sistema integral de gestión financiera para personas físicas con actividad empresarial en México.

## Pasos iniciales

### 1. Configura tus cuentas
Lo primero es agregar tus cuentas bancarias, tarjetas de crédito y cuentas de efectivo:
- Ve a **Finanzas → Cuentas**
- Haz clic en **"Agregar Cuenta"**
- Completa el nombre del banco, tipo de cuenta y saldo inicial
- Agrega todas tus cuentas para tener una visión completa

### 2. Define tus categorías
Las categorías te ayudan a organizar y analizar tus finanzas:
- Ve a **Finanzas → Categorías**
- Revisa las categorías predeterminadas
- Crea categorías personalizadas según tu negocio
- Define si son deducibles fiscalmente

### 3. Registra tus primeras transacciones
- Ve a **Finanzas → Transacciones**
- Haz clic en **"Nueva Transacción"**
- Completa: fecha, monto, cuenta, categoría y descripción
- Especifica la deducibilidad fiscal (ISR e IVA por separado)
- Adjunta comprobantes fiscales si los tienes

### 4. Configura reglas de deducibilidad
Automatiza la clasificación fiscal de tus gastos:
- Ve a **Fiscal → Reglas de Deducibilidad**
- Crea reglas basadas en categorías o palabras clave
- Define acciones automáticas (ISR deducible, IVA acreditable)

## Próximos pasos

Una vez completada la configuración inicial:
- Establece presupuestos mensuales
- Revisa el dashboard para ver tu situación financiera
- Configura metas de ahorro
- Explora el módulo fiscal para tus obligaciones

## ¿Necesitas ayuda?

Consulta otros artículos del Centro de Ayuda o usa la guía interactiva disponible en el menú.', 'inicio,configuración,primeros pasos,setup', 'beginner', 1, 1),

(1, 'Guía de inicio rápido en 5 minutos', 'guia-rapida-5-minutos', 'Comienza a usar el sistema en solo 5 minutos', '# Guía de inicio rápido en 5 minutos

¿Poco tiempo? Esta guía te ayudará a estar operativo en 5 minutos.

## Minuto 1: Crea tu cuenta principal
1. Ve a **Finanzas → Cuentas**
2. Clic en **"Agregar Cuenta"**
3. Agrega tu cuenta bancaria principal con su saldo actual

## Minuto 2: Define 3 categorías básicas
1. Ve a **Finanzas → Categorías**
2. Crea estas categorías esenciales:
   - Ingresos profesionales (deducible)
   - Gastos operativos (deducible)
   - Gastos personales (no deducible)

## Minuto 3: Registra tu primera transacción
1. Ve a **Finanzas → Transacciones**
2. Clic en **"Nueva Transacción"**
3. Registra un ingreso o gasto reciente
4. Marca la deducibilidad fiscal apropiada

## Minuto 4: Configura una regla simple
1. Ve a **Fiscal → Reglas de Deducibilidad**
2. Crea una regla para tu categoría de gastos operativos
3. Marca como ISR deducible e IVA acreditable

## Minuto 5: Explora el dashboard
1. Ve al **Dashboard** (botón de inicio)
2. Revisa tus saldos y movimientos
3. Activa las notificaciones (ícono de campana 🔔)

¡Listo! Ya puedes empezar a usar Avanta Finance. Explora más funciones a tu ritmo.', 'rápido,quick start,inicio rápido', 'beginner', 1, 2),

-- Transaction Articles
(2, '¿Cómo registro una transacción?', 'como-registrar-transaccion', 'Aprende a registrar ingresos y gastos correctamente', '# ¿Cómo registro una transacción?

Las transacciones son el corazón de tu gestión financiera. Aquí aprenderás a registrarlas correctamente.

## Tipos de transacciones

### Ingresos
- Pagos de clientes
- Honorarios profesionales
- Ventas de productos o servicios
- Rendimientos de inversiones

### Gastos
- Compras de insumos
- Servicios profesionales
- Gastos operativos
- Inversiones en activos

## Proceso de registro

### 1. Accede al módulo
Ve a **Finanzas → Transacciones** y haz clic en **"Nueva Transacción"**

### 2. Completa los campos básicos
- **Fecha**: Fecha de la transacción
- **Tipo**: Ingreso o Gasto
- **Monto**: Cantidad sin IVA (si aplica)
- **Cuenta**: Cuenta bancaria o método de pago
- **Categoría**: Clasifica la transacción
- **Descripción**: Detalle claro y descriptivo

### 3. Especifica la deducibilidad fiscal
Para gastos, marca:
- ✅ **Deducible ISR**: Si reduce tu base gravable
- ✅ **IVA Acreditable**: Si el IVA es acreditable
- **Tipo de gasto**: Nacional, Internacional con factura, o Internacional sin factura

### 4. Adjunta comprobantes
- Arrastra archivos XML (CFDI) o PDF
- Los archivos se almacenan de forma segura
- Facilita auditorías y cumplimiento

### 5. Guarda la transacción
Haz clic en **"Guardar"** y la transacción se registrará inmediatamente.

## Mejores prácticas

1. **Registra diariamente**: No dejes acumular transacciones
2. **Sé descriptivo**: Usa descripciones claras para facilitar búsquedas
3. **Adjunta comprobantes**: Mantén documentación completa
4. **Revisa la deducibilidad**: Asegúrate de marcar correctamente
5. **Usa categorías consistentes**: Facilita el análisis posterior

## Editar o eliminar

Puedes editar o eliminar transacciones desde la lista:
- Haz clic en el ícono de lápiz para editar
- Haz clic en el ícono de basura para eliminar (soft delete)

Las eliminaciones son reversibles desde el registro de auditoría.', 'transacciones,registrar,ingresos,gastos', 'beginner', 1, 1),

-- Deductibility Articles
(5, '¿Qué es la deducibilidad granular?', 'deducibilidad-granular', 'Entiende la deducibilidad fiscal detallada', '# ¿Qué es la deducibilidad granular?

La deducibilidad granular es una característica clave de Avanta Finance que te permite especificar con precisión la deducibilidad fiscal de cada gasto.

## ¿Por qué es importante?

En México, para personas físicas con actividad empresarial:
- **ISR (Impuesto Sobre la Renta)**: Algunos gastos reducen tu base gravable
- **IVA (Impuesto al Valor Agregado)**: El IVA de algunos gastos es acreditable

**No todos los gastos son iguales**. Un gasto puede ser deducible para ISR pero NO tener IVA acreditable.

## Los dos componentes

### 1. Deducible ISR
Marca esta opción si el gasto:
- Es estrictamente indispensable para tu actividad
- Está amparado con comprobante fiscal
- Cumple con requisitos del SAT

### 2. IVA Acreditable
Marca esta opción si:
- El gasto tiene CFDI mexicano válido
- El IVA está desglosado correctamente
- El gasto no es en lista negra del SAT

## Ejemplos prácticos

### Caso 1: Compra de computadora en México
- ✅ Deducible ISR: Sí (herramienta de trabajo)
- ✅ IVA Acreditable: Sí (CFDI mexicano válido)
- Tipo: Nacional

### Caso 2: Servicio internacional con factura mexicana
- ✅ Deducible ISR: Sí (si es indispensable)
- ✅ IVA Acreditable: Sí (si tiene CFDI válido)
- Tipo: Internacional con factura

### Caso 3: Compra en Amazon USA
- ✅ Deducible ISR: Sí (si es indispensable)
- ❌ IVA Acreditable: NO (sin factura mexicana)
- Tipo: Internacional sin factura

### Caso 4: Comida de negocios
- ⚠️ Deducible ISR: Parcial (50% según SAT)
- ❌ IVA Acreditable: NO (no acreditable según SAT)
- Tipo: Nacional

## Reglas automáticas

Puedes crear reglas de deducibilidad para automatizar la clasificación:
- Ve a **Fiscal → Reglas de Deducibilidad**
- Crea reglas por categoría o palabra clave
- El sistema aplicará las reglas automáticamente

## Referencias legales

Consulta siempre con tu contador. Estas son directrices generales basadas en:
- Ley del ISR
- Ley del IVA
- Resolución Miscelánea Fiscal

Los criterios pueden variar según tu situación específica.', 'deducibilidad,ISR,IVA,fiscal', 'intermediate', 1, 1),

-- Fiscal Articles
(4, 'Calendario fiscal: fechas importantes', 'calendario-fiscal', 'Conoce las fechas límite de tus obligaciones fiscales', '# Calendario fiscal: fechas importantes

Mantén el control de tus obligaciones fiscales con este calendario de referencia.

## Obligaciones mensuales

### Declaración provisional de ISR
**Fecha límite:** Día 17 del mes siguiente
- Declara tus ingresos y gastos del mes
- Calcula y paga el ISR provisional
- Presenta ante el SAT vía portal

### Declaración de IVA
**Fecha límite:** Día 17 del mes siguiente
- Declara IVA cobrado e IVA acreditable
- Calcula saldo a favor o a cargo
- Presenta y paga vía portal SAT

### Retenciones de ISR (si aplica)
**Fecha límite:** Día 17 del mes siguiente
- Si tienes empleados o pagas honorarios
- Retén y entrega el ISR correspondiente

## Obligaciones trimestrales

### DIOT (Declaración Informativa de Operaciones con Terceros)
**Fecha límite:** Último día del mes siguiente al trimestre
- Enero-Marzo: entregar en abril
- Abril-Junio: entregar en julio
- Julio-Septiembre: entregar en octubre
- Octubre-Diciembre: entregar en enero

Informa operaciones con proveedores y IVA acreditable.

## Obligaciones anuales

### Declaración anual de ISR
**Fecha límite:** 30 de abril
- Consolida todas tus operaciones del año
- Aplica deducciones personales
- Determina impuesto anual
- Puede resultar saldo a favor o a cargo

### Declaración informativa de operaciones
**Fecha límite:** Febrero (varía según ingresos)
- Informa clientes y proveedores
- Solo si superas ciertos montos

## Otras fechas importantes

### Contabilidad electrónica
**Mensual:** Día 3 del segundo mes siguiente
- Envía balanza de comprobación al SAT
- A través del buzón tributario

### Aviso de actualización de actividades
**Cuando aplique:** Dentro de los 10 días siguientes al cambio
- Cambio de domicilio fiscal
- Cambio de obligaciones
- Alta o baja de establecimientos

## Recordatorios en Avanta Finance

El sistema te notifica automáticamente:
- 3 días antes del vencimiento
- El día del vencimiento
- Después del vencimiento (si no se ha cumplido)

Activa las notificaciones en el ícono de campana 🔔 para no olvidar tus obligaciones.

## Consejos

1. **No dejes para el último día**: Anticipa tus declaraciones
2. **Ten tu información lista**: Registra transacciones puntualmente
3. **Revisa antes de declarar**: Verifica cálculos y clasificaciones
4. **Guarda comprobantes**: Descarga acuses de recibo
5. **Consulta tu contador**: Ante cualquier duda

Este calendario es orientativo. Verifica siempre en el portal del SAT o con tu contador.', 'fiscal,calendario,fechas,obligaciones,ISR,IVA,SAT', 'intermediate', 1, 1),

-- Automation Articles
(9, 'Cómo crear reglas de deducibilidad', 'crear-reglas-deducibilidad', 'Automatiza la clasificación fiscal de tus gastos', '# Cómo crear reglas de deducibilidad

Las reglas de deducibilidad te permiten automatizar la clasificación fiscal de tus gastos, ahorrándote tiempo y reduciendo errores.

## ¿Qué son las reglas?

Las reglas son instrucciones automáticas que el sistema aplica cuando registras transacciones. Por ejemplo:

> "Si la categoría es **Transporte** → marcar como **ISR deducible** y **IVA acreditable**"

## Acceso

Ve a **Fiscal → Reglas de Deducibilidad**

## Crear una nueva regla

### Paso 1: Información básica
1. Haz clic en **"Nueva Regla"**
2. Nombre descriptivo: "Gastos de transporte deducibles"
3. Prioridad: 100 (mayor número = mayor prioridad)

### Paso 2: Define criterios de coincidencia

Puedes usar uno o varios criterios:

**Por categoría:**
- Selecciona una o varias categorías
- Ejemplo: "Transporte", "Gasolina", "Uber/Taxi"

**Por palabras clave:**
- Añade palabras que buscar en la descripción
- Ejemplo: "uber", "taxi", "gasolina", "estacionamiento"
- Sensible a mayúsculas: No

**Por rango de montos:**
- Monto mínimo y/o máximo
- Ejemplo: Gastos de comida entre $50 y $500

**Por tipo de transacción:**
- Solo gastos
- Solo ingresos
- Ambos

### Paso 3: Define acciones

Cuando se cumplan los criterios, aplicar:

1. **Marcar ISR deducible:** ✅ Sí / ❌ No
2. **Marcar IVA acreditable:** ✅ Sí / ❌ No
3. **Tipo de gasto:**
   - Nacional
   - Internacional con factura
   - Internacional sin factura

### Paso 4: Configuración adicional

- **Aplicar automáticamente:** Activar para que se aplique al registrar
- **Estado:** Activa / Inactiva

### Paso 5: Guardar

Haz clic en **"Guardar Regla"**

## Ejemplos de reglas útiles

### Regla 1: Gastos de oficina
- Criterios: Categoría "Papelería y oficina"
- Acciones: ISR deducible ✅, IVA acreditable ✅, Nacional

### Regla 2: Servicios internacionales
- Criterios: Palabras clave "aws", "azure", "google cloud"
- Acciones: ISR deducible ✅, IVA acreditable ❌, Internacional sin factura

### Regla 3: Comidas de negocios
- Criterios: Categoría "Comidas y restaurantes"
- Acciones: ISR deducible ✅ (nota: 50% según SAT), IVA acreditable ❌

### Regla 4: Transporte urbano
- Criterios: Palabras clave "uber", "cabify", "didi"
- Acciones: ISR deducible ✅, IVA acreditable ❌ (generalmente sin factura)

## Orden de evaluación

Si una transacción coincide con múltiples reglas:
1. Se evalúan por **prioridad** (mayor a menor)
2. La primera regla que coincida se aplica
3. Las demás se ignoran

Por eso es importante asignar prioridades correctamente.

## Aplicar reglas a transacciones existentes

Puedes aplicar reglas retroactivamente:
1. Ve a la lista de transacciones
2. Filtra las transacciones deseadas
3. Selecciona **"Aplicar reglas"** en acciones masivas

## Mejores prácticas

1. **Sé específico**: Reglas claras son más efectivas
2. **Usa prioridades**: Ordena de más específico a más general
3. **Revisa regularmente**: Ajusta reglas según tu experiencia
4. **Documenta**: Usa nombres descriptivos
5. **Prueba primero**: Crea reglas inactivas y prueba antes de activar

Las reglas te ahorran tiempo y garantizan consistencia en tu clasificación fiscal.', 'reglas,automatización,deducibilidad,clasificación automática', 'intermediate', 1, 1);

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Verify the migration
SELECT 'Help System Migration Completed!' as status;
SELECT 'Categories: ' || COUNT(*) as stat FROM help_categories;
SELECT 'Articles: ' || COUNT(*) as stat FROM help_articles;
