# Plan de Implementación: Avanta CoinMaster 2.0

## Introducción

Este documento describe la hoja de ruta para implementar funcionalidades clave en la aplicación CoinMaster. El objetivo es transformar la herramienta de un simple agregador de datos a un asistente financiero inteligente para Personas Físicas con Actividad Empresarial (PFAE).

El plan está dividido en fases, comenzando con las funcionalidades más críticas y fundamentales, para luego construir sobre ellas con mejoras de inteligencia y experiencia de usuario.

**Stack Tecnológico Asumido:**
*   **Frontend:** React (`/src`)
*   **Backend:** Cloudflare Workers (`/functions`)
*   **Base de Datos:** Cloudflare D1 (`schema.sql`)

---

## Fase 0: Mejoras de Usabilidad y Flujo (Calidad de Vida)

**Objetivo:** Implementar funcionalidades pequeñas y de alto impacto que pulen la experiencia de usuario principal y mejoran la interconexión de los módulos existentes antes de abordar fases más complejas.

### 1. Interacción con Datos (Tablas)
*   **Funcionalidad:** Filtro y Búsqueda.
*   **Funcionalidad:** Edición de Transacciones.
*   **Funcionalidad:** Eliminación de Transacciones con Papelera / Deshacer.
*   **Funcionalidad:** Clasificación en Lote (Bulk Editing).
*   **Funcionalidad:** Ordenamiento de Tablas por Columna.

### 2. Visualización de Datos
*   **Funcionalidad:** Desglose de Saldos por Cuenta.
*   **Funcionalidad:** Controles de Periodo para Gráficas.
*   **Funcionalidad:** Colores para Montos Positivos/Negativos.
*   **Funcionalidad:** Vista de "Tarjeta" para Tablas en Móvil.

### 3. Gestión y Personalización
*   **Funcionalidad:** Gestión de Cuentas Bancarias (CRUD).
*   **Funcionalidad:** Gestión de Categorías Personalizadas (CRUD).
*   **Funcionalidad:** Recordar Filtros aplicados por el usuario.

### 4. Importación y Exportación de Datos
*   **Funcionalidad:** Mapeo de Columnas para Importación de CSV.
*   **Funcionalidad:** Exportar datos de la vista actual a CSV/Excel.

### 5. Feedback y Automatizaciones Inteligentes
*   **Funcionalidad:** Notificaciones "Toast" para confirmar acciones.
*   **Funcionalidad:** Sugerencia de Categoría basada en historial.

---

## Fase 1: Clasificación Avanzada de Transacciones (La Base)

**Objetivo:** Permitir al usuario diferenciar de forma granular entre transacciones personales y de negocio, y vincular gastos con sus comprobantes fiscales.

### 1.1. Actualizar el Modelo de Datos
*   **Tarea:** Modificar el esquema de la base de datos para soportar la nueva lógica.
*   **Archivo:** `schema.sql`
*   **Cambios:**
    1.  En la tabla `transactions`, añadir las siguientes columnas:
        *   `type` TEXT CHECK(type IN ('business', 'personal', 'transfer')) NOT NULL DEFAULT 'personal';
        *   `category_id` INTEGER; -- FK a la tabla de categorías
        *   `linked_invoice_id` INTEGER; -- FK a la tabla de facturas/CFDIs
        *   `notes` TEXT;
        *   `is_deleted` BOOLEAN DEFAULT FALSE;

### 1.2. Extender la API de Transacciones
*   **Tarea:** Actualizar los endpoints del backend para manejar los nuevos campos.
*   **Archivo:** `functions/api/transactions.js`
*   **Cambios:**
    1.  Modificar el endpoint `POST` para aceptar los nuevos campos.
    2.  Crear un endpoint `PATCH /:id` para la edición.
    3.  Modificar el endpoint `DELETE /:id` para que realice un borrado lógico (cambiar `is_deleted` a `true`).
    4.  Crear un endpoint `POST /:id/restore` para revertir el borrado lógico.

---

## Fase 2: Módulo Fiscal y Conciliación

**Objetivo:** Proveer al usuario una estimación de sus impuestos y permitirle conciliar movimientos entre sus propias cuentas.

---

## Fase 3: Automatización y Cuentas por Cobrar/Pagar

**Objetivo:** Reducir el trabajo manual del usuario y darle claridad sobre el estado de sus facturas.

---

## Fase 4: Analítica Avanzada y Mejoras de UX

**Objetivo:** Ofrecer insights de alto valor y funcionalidades que mejoren la experiencia general.
