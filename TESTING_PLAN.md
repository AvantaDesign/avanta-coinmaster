# 🧪 Plan de Pruebas - Avanta Finance

## ✅ Estado Actual
- **Servidor de desarrollo:** ✅ Ejecutándose en `http://localhost:5173/`
- **Datos mock:** ✅ Implementados y funcionando
- **Errores de API:** ✅ Solucionados
- **Navegación:** ✅ Funcionando

---

## 🎯 Plan de Pruebas Completo

### 0. **Base de Datos D1** (Pre-requisito)
**Objetivo:** Verificar configuración y operación de Cloudflare D1

**Pruebas a realizar:**
- [ ] **Infraestructura D1:**
  - [ ] Wrangler CLI instalado y autenticado
  - [ ] Database creada: `wrangler d1 list` muestra `avanta-finance`
  - [ ] Database ID configurado en wrangler.toml
  - [ ] Conexión verificada: `wrangler d1 execute avanta-finance --command="SELECT 1"`
- [ ] **Schema y Migraciones:**
  - [ ] Tabla `transactions` creada con todos los campos
  - [ ] Tabla `accounts` creada con datos por defecto
  - [ ] Tabla `invoices` creada con constraints UUID
  - [ ] Tabla `fiscal_payments` creada con unique constraint
  - [ ] Todos los índices creados (5 índices)
- [ ] **Operaciones CRUD:**
  - [ ] INSERT: Agregar nueva transacción
  - [ ] SELECT: Leer transacciones con filtros
  - [ ] UPDATE: Modificar transacción existente
  - [ ] DELETE: Eliminar transacción de prueba
  - [ ] Constraints: Validar tipos (ingreso/gasto) y categorías (personal/avanta)
- [ ] **Queries de Negocio:**
  - [ ] Balance total: SUM de cuentas banco - crédito
  - [ ] Ingresos mensuales: SUM con filtro fecha y tipo='ingreso'
  - [ ] Gastos deducibles: SUM con filtro is_deductible=1
  - [ ] Cálculo ISR: (ingresos - gastos deducibles) * 0.20
  - [ ] Cálculo IVA: (IVA cobrado - IVA pagado) * 0.16
- [ ] **Performance:**
  - [ ] Query con índice de fecha < 100ms
  - [ ] Agregaciones SUM/COUNT < 200ms
  - [ ] INSERT/UPDATE/DELETE < 50ms
- [ ] **Error Handling:**
  - [ ] Conexión fallida retorna error 503
  - [ ] Query inválido retorna error 500
  - [ ] Constraint violation retorna error apropiado

**Script de Prueba:** `./test-d1-database.sh test`

**Documentación:** Ver `D1_TESTING_GUIDE.md` para detalles completos

---

### 1. **Dashboard Principal** (`/`)
**Objetivo:** Verificar que el dashboard muestre datos reales desde D1

**Pruebas a realizar:**
- [ ] **Balance Total:** Debe mostrar balance correcto desde accounts table
- [ ] **Ingresos del Mes:** Calculado desde transactions con filtro fecha
- [ ] **Gastos del Mes:** Calculado desde transactions con filtro fecha
- [ ] **Últimas Transacciones:** Top 5-10 de transactions ORDER BY date DESC
- [ ] **Botones de Acción:** 
  - [ ] "Ver Transacciones" → navega a `/transactions`
  - [ ] "Vista Fiscal" → navega a `/fiscal`
  - [ ] "Agregar Transacción" → navega a `/transactions`
  - [ ] "Subir Factura" → navega a `/invoices`
  - [ ] "Ver Cálculo Fiscal" → navega a `/fiscal`

### 2. **Página de Transacciones** (`/transactions`)
**Objetivo:** Verificar CRUD completo de transacciones con D1

**Pruebas a realizar:**
- [ ] **Lista de Transacciones:** Debe mostrar todas las transacciones desde D1
- [ ] **Conexión D1:** Verificar que datos vienen de database, no mock
- [ ] **Filtros:** 
  - [ ] Filtrar por categoría (Personal/Avanta)
  - [ ] Filtrar por tipo (Ingreso/Gasto)
  - [ ] Filtrar por rango de fechas
  - [ ] Filtrar por cuenta
  - [ ] Filtrar por deducible/no deducible
- [ ] **Agregar Transacción:**
  - [ ] Formulario se abre correctamente
  - [ ] Campos requeridos funcionan (validación frontend)
  - [ ] Validación backend (API retorna errores apropiados)
  - [ ] Nueva transacción se guarda en D1
  - [ ] Nueva transacción aparece en la lista sin recargar
  - [ ] ID generado por D1 (AUTOINCREMENT)
- [ ] **Editar Transacción:**
  - [ ] Botón de editar funciona
  - [ ] Formulario se pre-llena con datos desde D1
  - [ ] Cambios se guardan en D1 (UPDATE)
  - [ ] Cambios se reflejan inmediatamente en lista
- [ ] **Eliminar Transacción:**
  - [ ] Confirmación de eliminación (confirm=true)
  - [ ] Transacción se elimina de D1
  - [ ] Transacción desaparece de la lista
  - [ ] No se puede eliminar sin confirmación

### 3. **Vista Fiscal** (`/fiscal`)
**Objetivo:** Verificar cálculos fiscales correctos desde D1

**Pruebas a realizar:**
- [ ] **Datos del Mes Actual:**
  - [ ] Ingresos: Calculados desde D1 (SUM where type='ingreso')
  - [ ] Gastos Deducibles: Calculados desde D1 (SUM where is_deductible=1)
  - [ ] Utilidad: Ingresos - Gastos Deducibles
  - [ ] ISR Provisional: Utilidad × 20%
  - [ ] IVA a Pagar: (IVA Cobrado - IVA Pagado) = 16% diferencia
  - [ ] Fecha Límite: 17 del mes siguiente
- [ ] **Selector de Mes/Año:**
  - [ ] Cambiar a diferentes meses actualiza query D1
  - [ ] Cálculos se actualizan con datos del mes seleccionado
  - [ ] Manejo de meses sin transacciones (valores en 0)
- [ ] **Historial de Pagos:** 
  - [ ] Lee desde fiscal_payments table
  - [ ] Muestra status (pending/paid/overdue)
  - [ ] Permite registrar nuevo pago

### 4. **Página de Facturas** (`/invoices`)
**Objetivo:** Verificar gestión de facturas CFDI con D1

**Pruebas a realizar:**
- [ ] **Lista de Facturas:** Debe mostrar facturas desde invoices table
- [ ] **Filtros:**
  - [ ] Facturas Emitidas (rfc_emisor = REGM000905T24)
  - [ ] Facturas Recibidas (rfc_receptor = REGM000905T24)
  - [ ] Status (active/cancelled)
- [ ] **Detalles de Factura:**
  - [ ] UUID único (constraint UNIQUE en D1)
  - [ ] RFC emisor y receptor correctos
  - [ ] Montos (subtotal, IVA, total)
  - [ ] Cálculo IVA = total - subtotal
  - [ ] Estado (vigente/cancelada)
  - [ ] URL XML (si existe)
- [ ] **Agregar Factura:**
  - [ ] Formulario funciona con validación
  - [ ] Validación UUID único (D1 constraint)
  - [ ] Nueva factura se guarda en D1
  - [ ] Nueva factura aparece en la lista
- [ ] **Subir Archivo:**
  - [ ] Upload XML a R2
  - [ ] URL generada y guardada en D1
  - [ ] Archivo accesible desde URL

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
**Objetivo:** Verificar características específicas del sistema fiscal mexicano con D1

**Pruebas a realizar:**
- [ ] **Actividades Económicas:**
  - [ ] 512191 - Producción videoclips (guardado en D1)
  - [ ] 463111 - Comercio artesanías (guardado en D1)
  - [ ] Otras actividades disponibles
  - [ ] Query de agregación por actividad económica
- [ ] **Clasificación de Gastos:**
  - [ ] Gastos deducibles vs no deducibles (is_deductible field)
  - [ ] Categorización Personal vs Avanta (category field)
  - [ ] Filtros en queries funcionan correctamente
- [ ] **Cálculos Fiscales:**
  - [ ] Tasa ISR 20% simplificada (desde D1 aggregations)
  - [ ] IVA 16% correcto (desde D1 aggregations)
  - [ ] Fechas límite día 17 (calculado en fiscal_payments)
- [ ] **Integridad de Datos:**
  - [ ] Constraints de tipo y categoría funcionan
  - [ ] UUIDs únicos en invoices
  - [ ] Year/month únicos en fiscal_payments
  - [ ] Foreign keys respetados (si aplican)
- [ ] **Performance D1:**
  - [ ] Queries con índices son rápidos (< 100ms)
  - [ ] Aggregaciones funcionan eficientemente
  - [ ] No timeouts en queries normales

---

### 7. **API Endpoints con D1** (Backend Testing)
**Objetivo:** Verificar que todos los endpoints API funcionan correctamente con D1

**Pruebas a realizar:**

#### Dashboard API (`/api/dashboard`)
- [ ] GET request retorna datos desde D1
- [ ] Balance total calculado desde accounts table
- [ ] Ingresos/gastos del mes desde transactions
- [ ] Recent transactions desde D1
- [ ] Manejo de error si D1 no disponible (503)
- [ ] CORS headers presentes

#### Transactions API (`/api/transactions`)
- [ ] GET all transactions desde D1
- [ ] GET single transaction by ID
- [ ] POST create transaction guarda en D1
- [ ] PUT update transaction actualiza D1
- [ ] DELETE transaction elimina de D1
- [ ] Filtros funcionan (category, type, date range)
- [ ] Paginación funciona (limit, offset)
- [ ] Validación de campos (400 errors)
- [ ] Transaction not found (404 error)
- [ ] Database errors manejados (500 error)

#### Accounts API (`/api/accounts`)
- [ ] GET lista cuentas desde D1
- [ ] PUT actualiza balance en D1
- [ ] Validación de balance requerido
- [ ] Error handling para ID inválido

#### Fiscal API (`/api/fiscal`)
- [ ] GET calcula ISR/IVA desde D1 transactions
- [ ] Filtro por mes/año funciona
- [ ] Aggregaciones correctas (SUM)
- [ ] Handling de meses sin datos
- [ ] Due date calculado correctamente

#### Invoices API (`/api/invoices`)
- [ ] GET lista facturas desde D1
- [ ] POST crea factura en D1
- [ ] Validación UUID único (D1 constraint)
- [ ] Campos requeridos validados
- [ ] Status field correcto

#### Upload API (`/api/upload`)
- [ ] **POST /api/upload** - Upload files to R2
  - [ ] Accepts multipart/form-data with file
  - [ ] Returns 201 with file URL on success
  - [ ] Returns 400 if no file provided (FILE_REQUIRED)
  - [ ] Returns 400 for invalid file type (INVALID_FILE_TYPE)
  - [ ] Returns 413 for file too large (FILE_TOO_LARGE)
  - [ ] Returns 503 if R2 not configured (R2_NOT_CONFIGURED)
  - [ ] Generates unique filename with timestamp
  - [ ] Sanitizes filename (removes special chars)
  - [ ] Preserves original filename in metadata
  - [ ] Returns comprehensive response with metadata
  - [ ] Response includes file size in bytes and MB
  - [ ] Response includes upload duration
  - [ ] Response includes file type icon and category
  - [ ] Stores file with correct content type
- [ ] **GET /api/upload/:filename** - Download files from R2
  - [ ] Returns 200 with file data on success
  - [ ] Returns 404 if file not found (FILE_NOT_FOUND)
  - [ ] Returns correct Content-Type header
  - [ ] Sets Content-Disposition (inline for images/PDF, download for others)
  - [ ] Sets Cache-Control header for performance
  - [ ] Returns 503 if R2 not configured
- [ ] **OPTIONS /api/upload** - CORS preflight
  - [ ] Returns 204 status
  - [ ] Includes CORS headers
  - [ ] Allows GET, POST methods
- [ ] **File Type Validation**
  - [ ] Accepts JPEG images (image/jpeg)
  - [ ] Accepts PNG images (image/png)
  - [ ] Accepts GIF images (image/gif)
  - [ ] Accepts PDF documents (application/pdf)
  - [ ] Accepts XML files (text/xml, application/xml)
  - [ ] Rejects text files (.txt)
  - [ ] Rejects executable files
  - [ ] Rejects other unsupported types
- [ ] **File Size Validation**
  - [ ] Accepts files up to 10 MB
  - [ ] Rejects files larger than 10 MB
  - [ ] Returns error with size details
- [ ] **Security Features**
  - [ ] Filename sanitization works (special chars removed)
  - [ ] Timestamp prefix prevents collisions
  - [ ] Content-Type validation on server
  - [ ] No path traversal vulnerabilities
- [ ] **Error Handling**
  - [ ] All errors return JSON format
  - [ ] Error codes included (machine-readable)
  - [ ] Detailed error messages provided
  - [ ] Logging for debugging (console.log/error)

**Script de Prueba:** `./test-api.sh http://localhost:8788`

---

## 🚀 Instrucciones de Prueba

### Paso 0: Setup D1 Database (Pre-requisito)
**IMPORTANTE: Debe completarse antes de cualquier otra prueba**

1. Instalar y autenticar Wrangler
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. Crear y configurar D1 database
   ```bash
   # Opción A: Automated setup (recomendado)
   ./test-d1-database.sh setup
   
   # Opción B: Manual setup
   wrangler d1 create avanta-finance
   # Copiar database_id a wrangler.toml
   wrangler d1 execute avanta-finance --file=schema.sql
   ```

3. Cargar datos de prueba
   ```bash
   ./test-d1-database.sh seed
   ```

4. Verificar setup
   ```bash
   ./test-d1-database.sh verify
   ```

5. Ejecutar tests de D1
   ```bash
   ./test-d1-database.sh test
   ```

**Documentación completa:** Ver `D1_TESTING_GUIDE.md`

---

### Paso 0.5: Setup R2 Bucket (Pre-requisito)
**IMPORTANTE: Debe completarse para pruebas de file upload**

1. Crear R2 bucket
   ```bash
   wrangler r2 bucket create avanta-receipts
   ```

2. Verificar bucket
   ```bash
   wrangler r2 bucket list
   ```

3. Probar subida de archivo
   ```bash
   echo "Test" > test.txt
   wrangler r2 object put avanta-receipts/test.txt --file=test.txt
   ```

4. Verificar archivo subido
   ```bash
   wrangler r2 object list avanta-receipts
   ```

5. Limpiar archivo de prueba
   ```bash
   wrangler r2 object delete avanta-receipts/test.txt
   ```

6. Verificar configuración en `wrangler.toml`:
   ```toml
   [[r2_buckets]]
   binding = "RECEIPTS"
   bucket_name = "avanta-receipts"
   ```

**Documentación completa:** Ver `R2_SETUP_GUIDE.md`

---

### Paso 1: Iniciar Servidor de Desarrollo con D1
1. Build el frontend
   ```bash
   npm install
   npm run build
   ```

2. Iniciar Wrangler dev server con D1 binding
   ```bash
   npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788
   ```

3. Abrir navegador en `http://localhost:8788/`
4. Verificar que no hay errores en consola (F12)
5. Dashboard debe cargar con datos reales desde D1

### Paso 2: Probar Cada Sección
1. **Dashboard:** Verificar balances y transacciones recientes desde D1
2. **Transacciones:** Probar agregar/editar/eliminar con D1
3. **Fiscal:** Verificar cálculos del mes actual desde D1
4. **Facturas:** Revisar facturas y agregar nueva en D1

### Paso 3: Pruebas de Integración con D1
1. Agregar nueva transacción desde Dashboard
2. Verificar que se guarda en D1 (check en wrangler)
3. Verificar que aparece en lista de transacciones
4. Verificar que cálculos fiscales se actualizan automáticamente
5. Probar navegación entre todas las páginas

### Paso 4: Pruebas de API con D1
```bash
# Asegurar que el servidor con D1 está corriendo
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788

# En otra terminal, ejecutar tests de API
./test-api.sh http://localhost:8788
```

### Paso 5: Pruebas de R2 Upload
```bash
# Asegurar que el servidor está corriendo (con R2 binding)
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788

# En otra terminal, ejecutar tests de R2
./test-r2-upload.sh http://localhost:8788
```

**El test script verificará:**
- ✅ CORS preflight requests (OPTIONS)
- ✅ Valid file uploads (PNG, JPEG, PDF, XML)
- ✅ File type validation (rejects .txt files)
- ✅ File size validation (rejects >10MB files)
- ✅ Filename sanitization (special characters)
- ✅ Response format and metadata
- ✅ File download functionality (GET)
- ✅ Error handling (404 for missing files)

**Pruebas manuales adicionales:**
1. **Ir a Facturas page** (`http://localhost:8788/invoices`)
2. **Click "Agregar Factura"**
3. **Drag and drop un archivo XML o PDF**
4. **Verificar:**
   - Preview se muestra (si es imagen)
   - Progress bar aparece
   - Success message se muestra
   - Archivo URL se guarda en form
5. **Probar con archivo inválido:**
   - Intentar subir .txt file
   - Verificar error message
6. **Probar con archivo grande:**
   - Intentar subir archivo >10MB
   - Verificar error message con detalles

**Verificar archivos en R2:**
```bash
# Listar archivos subidos
wrangler r2 object list avanta-receipts

# Ver detalles de un archivo
wrangler r2 object get avanta-receipts/FILENAME --file=downloaded-file
```

---

## 📊 Datos de Prueba en D1

**Fuente:** `seed.sql` - Se cargan automáticamente con `./test-d1-database.sh seed`

### Transacciones (14 registros en Octubre 2025):
1. **Venta servicio diseño web:** $15,000 (ingreso, Avanta)
2. **Compra equipo fotografía:** $8,500 (gasto, Avanta, deducible)
3. **Pago renta local:** $5,000 (gasto, Avanta, deducible)
4. **Ingreso por videoclip:** $25,000 (ingreso, Avanta)
5. **Compra software Adobe:** $1,200 (gasto, Avanta, deducible)
6. **Supermercado:** $2,500 (gasto, personal, no deducible)
7. **Ingreso venta artesanías:** $3,500 (ingreso, Avanta)
8. **Gasolina:** $800 (gasto, personal, no deducible)
9. **Servicio publicidad:** $12,000 (ingreso, Avanta)
10. **Materiales producción:** $4,500 (gasto, Avanta, deducible)
11. **Internet y hosting:** $850 (gasto, Avanta, deducible)
12. **Producción video:** $18,000 (ingreso, Avanta)
13. **Restaurante:** $1,200 (gasto, personal, no deducible)
14. **Servicios profesionales:** $9,500 (ingreso, Avanta)

**Totales calculados:**
- Ingresos Avanta: $83,000
- Gastos deducibles: $20,050
- Utilidad: $62,950
- ISR (20%): $12,590
- IVA a pagar: ~$10,072

### Cuentas (3 registros):
1. **BBVA Cuenta Principal:** $45,000
2. **Banco Azteca:** $8,000
3. **Tarjeta de Crédito BBVA:** -$2,050

**Balance Total:** $50,950

### Facturas (4 registros):
1. **Factura 1:** $15,000 (Emitida, IVA: $2,068.97)
2. **Factura 2:** $8,500 (Recibida, IVA: $1,172.41)
3. **Factura 3:** $25,000 (Emitida, IVA: $3,448.28)
4. **Factura 4:** $12,000 (Emitida, IVA: $1,655.17)

### Pagos Fiscales (2 registros):
1. **Septiembre 2025:** ISR $4,500, IVA $3,200 (pagado)
2. **Octubre 2025:** Pendiente (due 17-Nov-2025)

---

## ✅ Criterios de Éxito

**La aplicación está lista cuando:**
- [ ] D1 database creada y configurada correctamente
- [ ] Schema migrations ejecutadas sin errores
- [ ] Datos de prueba cargados (seed.sql)
- [ ] `./test-d1-database.sh test` pasa todos los tests
- [ ] Todas las páginas cargan sin errores desde D1
- [ ] Los datos mostrados provienen de D1 (no mock)
- [ ] La navegación funciona perfectamente
- [ ] Los cálculos fiscales son precisos desde D1
- [ ] CRUD operations funcionan (Create, Read, Update, Delete)
- [ ] El diseño es responsive y profesional
- [ ] No hay errores en la consola del navegador
- [ ] API tests pasan: `./test-api.sh http://localhost:8788`
- [ ] Error handling funciona (DB connection, queries, constraints)
- [ ] Performance aceptable (queries < 100ms)

---

## 📋 Checklist de D1 Integration

### Pre-deployment
- [ ] Wrangler CLI instalado y configurado
- [ ] Cloudflare account autenticado
- [ ] D1 database creada
- [ ] Database ID en wrangler.toml
- [ ] Schema migrations aplicadas
- [ ] Seed data cargado
- [ ] Database tests pasados

### API Integration
- [ ] Todos los endpoints conectan a D1
- [ ] Error handling implementado
- [ ] CORS configurado correctamente
- [ ] Validation en place
- [ ] Queries optimizadas con índices

### Testing
- [ ] Unit tests para queries
- [ ] Integration tests para API
- [ ] End-to-end tests para frontend
- [ ] Performance tests
- [ ] Error scenario tests

### Documentation
- [ ] D1_TESTING_GUIDE.md completa
- [ ] TESTING_PLAN.md actualizada
- [ ] IMPLEMENTATION_SUMMARY.md actualizada
- [ ] DEPLOYMENT.md incluye D1 setup
- [ ] README.md menciona D1

---

## 🎉 ¡Listo para Probar con D1!

**Tu aplicación Avanta Finance está completamente funcional con Cloudflare D1 database. Puedes probar todas las características del sistema de contabilidad fiscal mexicano con datos reales almacenados en D1.**

**Próximos pasos:**
1. ✅ Completar setup D1: `./test-d1-database.sh setup`
2. ✅ Cargar datos de prueba: `./test-d1-database.sh seed`
3. ✅ Ejecutar tests D1: `./test-d1-database.sh test`
4. ✅ Iniciar dev server con D1
5. ✅ Probar API endpoints: `./test-api.sh http://localhost:8788`
6. ✅ Verificar frontend con datos reales
7. 🚀 Deploy a producción (ver DEPLOYMENT.md)

**Scripts disponibles:**
- `./test-d1-database.sh` - Setup y testing de D1
- `./test-api.sh` - Testing de API endpoints
- Ver `D1_TESTING_GUIDE.md` para guía completa

**¡Disfruta probando tu sistema de contabilidad con D1!** 🚀
