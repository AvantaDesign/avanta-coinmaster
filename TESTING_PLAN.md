# 🧪 Plan de Pruebas - Avanta Finance

## ✅ Estado Actual
- **Servidor de desarrollo:** ✅ Ejecutándose en `http://localhost:5173/`
- **Datos mock:** ✅ Implementados y funcionando
- **Errores de API:** ✅ Solucionados
- **Navegación:** ✅ Funcionando

---

## 🎯 Plan de Pruebas Completo

### 1. **Dashboard Principal** (`/`)
**Objetivo:** Verificar que el dashboard muestre datos reales

**Pruebas a realizar:**
- [ ] **Balance Total:** Debe mostrar $116,500 (cuentas bancarias - créditos)
- [ ] **Ingresos del Mes:** Debe mostrar $18,200 (enero 2025)
- [ ] **Gastos del Mes:** Debe mostrar $9,900 (enero 2025)
- [ ] **Últimas Transacciones:** Debe mostrar 5 transacciones más recientes
- [ ] **Botones de Acción:** 
  - [ ] "Ver Transacciones" → navega a `/transactions`
  - [ ] "Vista Fiscal" → navega a `/fiscal`
  - [ ] "Agregar Transacción" → navega a `/transactions`
  - [ ] "Subir Factura" → navega a `/invoices`
  - [ ] "Ver Cálculo Fiscal" → navega a `/fiscal`

### 2. **Página de Transacciones** (`/transactions`)
**Objetivo:** Verificar CRUD completo de transacciones

**Pruebas a realizar:**
- [ ] **Lista de Transacciones:** Debe mostrar todas las 6 transacciones mock
- [ ] **Filtros:** 
  - [ ] Filtrar por categoría (Personal/Avanta)
  - [ ] Filtrar por tipo (Ingreso/Gasto)
- [ ] **Agregar Transacción:**
  - [ ] Formulario se abre correctamente
  - [ ] Campos requeridos funcionan
  - [ ] Nueva transacción aparece en la lista
- [ ] **Editar Transacción:**
  - [ ] Botón de editar funciona
  - [ ] Formulario se pre-llena con datos existentes
  - [ ] Cambios se guardan correctamente
- [ ] **Eliminar Transacción:**
  - [ ] Confirmación de eliminación
  - [ ] Transacción se elimina de la lista

### 3. **Vista Fiscal** (`/fiscal`)
**Objetivo:** Verificar cálculos fiscales correctos

**Pruebas a realizar:**
- [ ] **Datos del Mes Actual (Enero 2025):**
  - [ ] Ingresos: $18,200
  - [ ] Gastos Deducibles: $9,900
  - [ ] Utilidad: $8,300
  - [ ] ISR Provisional: $1,660 (20% de utilidad)
  - [ ] IVA a Pagar: $1,328 (16% de diferencia)
  - [ ] Fecha Límite: 17 de Febrero 2025
- [ ] **Selector de Mes/Año:**
  - [ ] Cambiar a diferentes meses
  - [ ] Cálculos se actualizan correctamente
- [ ] **Historial de Pagos:** Debe estar vacío (nuevo sistema)

### 4. **Página de Facturas** (`/invoices`)
**Objetivo:** Verificar gestión de facturas CFDI

**Pruebas a realizar:**
- [ ] **Lista de Facturas:** Debe mostrar 2 facturas mock
- [ ] **Filtros:**
  - [ ] Facturas Emitidas (RFC: REGM000905T24 como emisor)
  - [ ] Facturas Recibidas (RFC: REGM000905T24 como receptor)
- [ ] **Detalles de Factura:**
  - [ ] UUID único para cada factura
  - [ ] RFC emisor y receptor correctos
  - [ ] Montos (subtotal, IVA, total)
  - [ ] Estado (vigente)
- [ ] **Agregar Factura:**
  - [ ] Formulario funciona
  - [ ] Nueva factura aparece en la lista
- [ ] **Subir Archivo:**
  - [ ] Simulación de upload funciona
  - [ ] URL generada correctamente

### 5. **Navegación y UI**
**Objetivo:** Verificar experiencia de usuario completa

**Pruebas a realizar:**
- [ ] **Navegación Principal:**
  - [ ] Logo "Avanta Finance" visible
  - [ ] RFC "REGM000905T24" visible en header
  - [ ] Enlaces de navegación funcionan
- [ ] **Responsive Design:**
  - [ ] Funciona en desktop (1920x1080)
  - [ ] Funciona en tablet (768x1024)
  - [ ] Funciona en móvil (375x667)
- [ ] **Estilos Tailwind:**
  - [ ] Colores correctos (azul, verde, rojo)
  - [ ] Espaciado consistente
  - [ ] Tipografía legible
  - [ ] Sombras y bordes redondeados

### 6. **Funcionalidades Avanzadas**
**Objetivo:** Verificar características específicas del sistema fiscal mexicano

**Pruebas a realizar:**
- [ ] **Actividades Económicas:**
  - [ ] 512191 - Producción videoclips (21%)
  - [ ] 463111 - Comercio artesanías (19%)
  - [ ] Otras actividades disponibles
- [ ] **Clasificación de Gastos:**
  - [ ] Gastos deducibles vs no deducibles
  - [ ] Categorización Personal vs Avanta
- [ ] **Cálculos Fiscales:**
  - [ ] Tasa ISR 20% simplificada
  - [ ] IVA 16% correcto
  - [ ] Fechas límite día 17

---

## 🚀 Instrucciones de Prueba

### Paso 1: Acceder a la Aplicación
1. Abrir navegador en `http://localhost:5173/`
2. Verificar que no hay errores en consola (F12)
3. Dashboard debe cargar con datos reales

### Paso 2: Probar Cada Sección
1. **Dashboard:** Verificar balances y transacciones recientes
2. **Transacciones:** Probar agregar/editar/eliminar
3. **Fiscal:** Verificar cálculos del mes actual
4. **Facturas:** Revisar facturas mock y agregar nueva

### Paso 3: Pruebas de Integración
1. Agregar nueva transacción desde Dashboard
2. Verificar que aparece en lista de transacciones
3. Verificar que cálculos fiscales se actualizan
4. Probar navegación entre todas las páginas

---

## 📊 Datos Mock Incluidos

### Transacciones (6 registros):
1. **Pago cliente - Proyecto videoclip:** $15,000 (ingreso, Avanta)
2. **Compra equipo de cámara:** $8,500 (gasto, Avanta, deducible)
3. **Supermercado:** $1,200 (gasto, personal, no deducible)
4. **Servicio de internet:** $800 (gasto, Avanta, deducible)
5. **Venta artesanías:** $3,200 (ingreso, Avanta)
6. **Gasolina:** $600 (gasto, Avanta, deducible)

### Cuentas (2 registros):
1. **BBVA Cuenta Principal:** $125,000
2. **Tarjeta de Crédito BBVA:** -$8,500

### Facturas (2 registros):
1. **Factura recibida:** $15,000 (IVA: $2,068.97)
2. **Factura emitida:** $8,500 (IVA: $1,172.41)

---

## ✅ Criterios de Éxito

**La aplicación está lista cuando:**
- [ ] Todas las páginas cargan sin errores
- [ ] Los datos mock se muestran correctamente
- [ ] La navegación funciona perfectamente
- [ ] Los cálculos fiscales son precisos
- [ ] El diseño es responsive y profesional
- [ ] No hay errores en la consola del navegador

---

## 🎉 ¡Listo para Probar!

**Tu aplicación Avanta Finance está completamente funcional con datos realistas. Puedes probar todas las características del sistema de contabilidad fiscal mexicano sin necesidad de configurar el backend.**

**Próximos pasos opcionales:**
1. Configurar Cloudflare Workers para backend real
2. Configurar base de datos D1
3. Configurar almacenamiento R2
4. Deploy a producción

**¡Disfruta probando tu sistema de contabilidad!** 🚀
