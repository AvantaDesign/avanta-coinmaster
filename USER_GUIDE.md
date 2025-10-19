# Avanta Finance - Guía del Usuario

## 📘 Guía Completa del Sistema

**Versión:** 1.0  
**Última actualización:** Octubre 19, 2025

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Módulo de Transacciones](#módulo-de-transacciones)
4. [Módulo de Ingresos](#módulo-de-ingresos)
5. [Módulo de Gastos](#módulo-de-gastos)
6. [Gestión de CFDIs](#gestión-de-cfdis)
7. [Conciliación Bancaria](#conciliación-bancaria)
8. [Cálculos Fiscales](#cálculos-fiscales)
9. [Declaraciones SAT](#declaraciones-sat)
10. [Declaración Anual](#declaración-anual)
11. [Archivo Digital](#archivo-digital)
12. [Monitoreo de Cumplimiento](#monitoreo-de-cumplimiento)
13. [Análisis Fiscal](#análisis-fiscal)
14. [Configuración Fiscal](#configuración-fiscal)
15. [Mejores Prácticas](#mejores-prácticas)
16. [Solución de Problemas](#solución-de-problemas)

---

## Introducción

Avanta Finance es un sistema integral de gestión contable y fiscal diseñado específicamente para **personas físicas con actividad empresarial en México**. El sistema te ayuda a:

- ✅ Registrar y clasificar todas tus operaciones de ingresos y gastos
- ✅ Gestionar y vincular tus CFDIs (facturas electrónicas)
- ✅ Calcular automáticamente tu ISR e IVA mensuales
- ✅ Generar declaraciones fiscales (DIOT, Contabilidad Electrónica)
- ✅ Preparar tu declaración anual
- ✅ Mantener un archivo digital organizado
- ✅ Monitorear tu cumplimiento fiscal en tiempo real

### Requisitos del Sistema

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet
- Archivos XML de CFDIs
- Estados de cuenta bancarios en formato CSV (opcional)

---

## Primeros Pasos

### 1. Acceso al Sistema

1. Abre tu navegador y ve a la URL de Avanta Finance
2. Ingresa con tu usuario y contraseña
3. Verás el **Dashboard Principal** con un resumen de tu situación financiera

### 2. Dashboard Principal

El dashboard te muestra:
- **Balance actual** de tus cuentas
- **Ingresos y gastos** del mes
- **ISR e IVA** calculados
- **Alertas de cumplimiento**
- **Próximos pagos** y tareas pendientes

### 3. Navegación

El menú lateral te permite acceder a todos los módulos:

**📊 Finanzas**
- Dashboard
- Transacciones
- Cuentas
- Presupuestos

**💼 Fiscal**
- Configuración Fiscal
- Control de CFDIs
- Cálculos Fiscales
- Conciliación Bancaria
- Declaraciones SAT
- Declaración Anual
- Análisis Fiscal
- Archivo Digital
- Monitoreo de Cumplimiento
- Auditoría del Sistema

---

## Módulo de Transacciones

### Crear una Nueva Transacción

1. Ve a **Transacciones** en el menú
2. Haz clic en **"Agregar Transacción"**
3. Selecciona el tipo: **Ingreso** o **Gasto**
4. Completa el formulario según el tipo de transacción

### Tipos de Transacciones

#### **Ingresos**
- Honorarios por servicios
- Venta de productos
- Arrendamiento
- Otros ingresos empresariales

#### **Gastos**
- Compras de mercancías
- Gastos operativos
- Servicios profesionales
- Inversiones en activos fijos

### Campos Comunes

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| **Fecha** | Fecha de la operación | Sí |
| **Monto** | Cantidad en pesos | Sí |
| **Descripción** | Concepto de la operación | Sí |
| **Categoría** | Clasificación contable | Sí |
| **Cuenta** | Cuenta bancaria o efectivo | Sí |
| **Método de Pago** | Transferencia, efectivo, tarjeta | Sí |

---

## Módulo de Ingresos

### Registrar un Ingreso

1. Selecciona **"Agregar Transacción"** → **"Ingreso"**
2. Completa los campos básicos
3. Completa los campos fiscales:

#### Campos Fiscales del Ingreso

##### **Tipo de Cliente**
- **Nacional**: Cliente mexicano con RFC
- **Extranjero**: Cliente sin RFC mexicano

##### **RFC del Cliente** (para nacionales)
Ingresa el RFC de tu cliente en formato válido:
- Persona Moral: `ABC123456789` (12 caracteres)
- Persona Física: `ABCD123456EF0` (13 caracteres)

##### **Moneda y Tipo de Cambio**
- **MXN**: Pesos mexicanos (no requiere tipo de cambio)
- **USD**: Dólares (ingresa tipo de cambio del día)
- **EUR**: Euros (ingresa tipo de cambio del día)

💡 **Tip**: El sistema calcula automáticamente el equivalente en pesos.

##### **Método de Pago**
- **PUE** (Pago en Una Exhibición): El más común
- **PPD** (Pago en Parcialidades o Diferido): Para pagos diferidos

##### **Tasa de IVA**
- **16%**: Tasa general
- **0%**: Tasa de 0% (exportación de servicios, medicinas, alimentos)
- **Exento**: Sin IVA (honorarios médicos, servicios educativos, etc.)

##### **Retenciones**
- **Retención ISR**: Si tu cliente te retuvo ISR
- **Retención IVA**: Si tu cliente te retuvo IVA

### Ejemplo Completo: Servicio de Consultoría Nacional

```
Tipo: Ingreso
Fecha: 15/03/2025
Monto: $15,000.00
Descripción: Servicio de consultoría de TI
Categoría: Honorarios
Cuenta: Banco BBVA - Empresarial

--- Datos Fiscales ---
Tipo de Cliente: Nacional
RFC del Cliente: ABC123456789
Moneda: MXN
Método de Pago: PUE
Tasa de IVA: 16%
Retención ISR: $1,500.00 (10%)
Retención IVA: $384.00 (16% del IVA)
¿Tiene CFDI?: Sí
UUID del CFDI: 12345678-1234-1234-1234-123456789012
```

**Resultado:**
- IVA trasladado: $2,400
- IVA retenido: $384
- ISR retenido: $1,500
- Total a recibir: $15,516 ($15,000 + $2,400 - $384 - $1,500)

---

## Módulo de Gastos

### Registrar un Gasto

1. Selecciona **"Agregar Transacción"** → **"Gasto"**
2. Completa los campos básicos
3. Completa los campos fiscales:

#### Campos Fiscales del Gasto

##### **¿Tiene CFDI?**
- **Sí**: Tienes factura electrónica (la mayoría de gastos deducibles)
- **No**: No tienes factura (limita la deducibilidad)

##### **Deducibilidad para ISR**
Indica si el gasto es deducible para el cálculo del ISR:
- ✅ **Deducible**: Gastos estrictamente indispensables
- ❌ **No deducible**: Gastos personales o no relacionados

##### **IVA Acreditable**
Indica si puedes acreditar el IVA de este gasto:
- ✅ **Acreditable**: Gastos relacionados con tu actividad
- ❌ **No acreditable**: Gastos no relacionados o sin CFDI

##### **Porcentaje de Deducibilidad ISR**
Para gastos parcialmente deducibles (por ejemplo, vehículos mixtos):
- **100%**: Totalmente deducible
- **50%**: Deducible al 50% (ej. automóvil uso mixto)
- **Otro %**: Según corresponda

##### **Porcentaje de Acreditamiento IVA**
Similar a la deducibilidad ISR:
- **100%**: Totalmente acreditable
- **50%**: Acreditable al 50%
- **Otro %**: Según corresponda

### Reglas de Deducibilidad (SAT)

#### ✅ Gastos Deducibles con CFDI
- Compras de mercancías
- Gastos operativos (luz, agua, teléfono, internet)
- Servicios profesionales
- Renta de oficina/local
- Equipo de cómputo
- Papelería y útiles
- Publicidad y marketing
- Transporte de mercancías
- Seguros

#### ⚠️ Gastos Parcialmente Deducibles
- **Automóvil uso mixto**: 50% deducible ISR e IVA
- **Alimentos y bebidas**: 100% deducible pero IVA no acreditable
- **Combustible sin CFDI**: Solo si pagas con tarjeta bancaria o monedero electrónico

#### ❌ Gastos NO Deducibles
- Gastos personales
- Compras sin CFDI mayores a $2,000
- Pagos en efectivo mayores a $2,000
- Multas e infracciones
- Donativos sin autorización

### Ejemplo 1: Compra de Equipo de Cómputo

```
Tipo: Gasto
Fecha: 10/03/2025
Monto: $25,000.00
Descripción: Laptop Dell Inspiron 15
Categoría: Equipo de Cómputo
Cuenta: Tarjeta de Crédito Empresarial

--- Datos Fiscales ---
¿Tiene CFDI?: Sí
UUID del CFDI: 87654321-4321-4321-4321-210987654321
Deducible ISR: Sí (100%)
IVA Acreditable: Sí (100%)
Método de Pago: Tarjeta de Crédito
```

**Resultado:**
- Deducción ISR: $25,000 (100%)
- IVA acreditable: $4,000 (100% de $4,000)

### Ejemplo 2: Gasolina de Vehículo Uso Mixto

```
Tipo: Gasto
Fecha: 12/03/2025
Monto: $1,200.00
Descripción: Gasolina vehículo empresarial
Categoría: Combustibles
Cuenta: Tarjeta de Débito

--- Datos Fiscales ---
¿Tiene CFDI?: Sí (con IEPS)
UUID del CFDI: ABCD1234-5678-90AB-CDEF-123456789ABC
Deducible ISR: Sí (50%)
IVA Acreditable: Sí (50%)
Método de Pago: Tarjeta de Débito
```

**Resultado:**
- Deducción ISR: $600 (50% de $1,200)
- IVA acreditable: $96 (50% de $192)

---

## Gestión de CFDIs

### ¿Qué es un CFDI?

El CFDI (Comprobante Fiscal Digital por Internet) es la factura electrónica válida ante el SAT. **Todo ingreso y gasto mayor a $2,000 debe estar respaldado por un CFDI**.

### Control de CFDIs

Ve a **Fiscal** → **Control de CFDIs** para gestionar todos tus comprobantes.

#### Cargar CFDIs

1. **Opción 1: Arrastrar y Soltar**
   - Arrastra tus archivos XML directamente a la zona de carga
   - El sistema procesa múltiples archivos a la vez

2. **Opción 2: Seleccionar Archivos**
   - Haz clic en "Seleccionar archivos XML"
   - Elige uno o varios archivos .xml de tu computadora

#### ¿Qué Hace el Sistema?

Cuando cargas un CFDI, el sistema automáticamente:

1. **Extrae los datos** del XML:
   - UUID único del comprobante
   - Emisor (RFC, nombre)
   - Receptor (tu RFC, nombre)
   - Fecha de emisión y certificación
   - Montos (subtotal, IVA, total)
   - Moneda y tipo de cambio
   - Método de pago
   - Forma de pago

2. **Valida el CFDI**:
   - ✅ RFC válido y formato correcto
   - ✅ UUID único (detecta duplicados)
   - ✅ Estructura XML correcta
   - ✅ Tipo de comprobante (ingreso/egreso)

3. **Intenta vincular automáticamente**:
   - Busca transacciones sin CFDI con el mismo monto y fecha aproximada
   - Si encuentra coincidencia, sugiere vincular

#### Estados del CFDI

| Estado | Significado | Acción |
|--------|-------------|--------|
| 🟢 **Válido** | CFDI correcto y vinculado | Ninguna |
| 🟡 **Pendiente de Validación** | Recién cargado, esperando verificación | Revisar |
| 🔴 **RFC Inválido** | Problema con el RFC | Corregir RFC |
| ⚫ **Cancelado** | Factura cancelada ante el SAT | Eliminar o marcar |
| ❌ **Error** | Problema al procesar | Verificar XML |

### Vincular CFDI a Transacción

#### Vinculación Automática
El sistema intenta vincular automáticamente cuando:
- El UUID del CFDI coincide con una transacción existente
- No existe, pero hay una transacción con monto y fecha similar

#### Vinculación Manual

1. Localiza el CFDI sin vincular en la lista
2. Haz clic en **"Vincular"**
3. Selecciona la transacción correspondiente de la lista
4. Confirma la vinculación

💡 **Tip**: Usa los filtros para encontrar transacciones por fecha, monto o descripción.

### Filtros y Búsqueda

- **Por Tipo**: Ingreso, Egreso, Pago, Nómina
- **Por Estado**: Válido, Pendiente, Cancelado
- **Por Fecha**: Rango de fechas de emisión
- **Por Búsqueda**: UUID, RFC emisor, descripción

---

## Conciliación Bancaria

La conciliación bancaria te permite verificar que todos tus ingresos y gastos **realmente se efectuaron** en tu cuenta bancaria (requisito del SAT: "pago efectivamente realizado").

### ¿Por Qué es Importante?

El SAT requiere que puedas **comprobar que el pago se realizó**. La conciliación bancaria:
- ✅ Verifica el pago efectivamente realizado
- ✅ Detecta transacciones no registradas
- ✅ Identifica errores de captura
- ✅ Ayuda a mantener tu contabilidad al día

### Cargar Estado de Cuenta

Ve a **Fiscal** → **Conciliación Bancaria** → pestaña **"Cargar"**.

#### Formato CSV Requerido

Tu archivo CSV debe tener estas columnas (el orden puede variar):

```csv
Fecha,Descripción,Cargo,Abono,Saldo
15/03/2025,Pago de cliente ABC,0,15000,50000
16/03/2025,Compra de equipo,25000,0,25000
```

**Columnas obligatorias:**
- **Fecha**: En formato DD/MM/AAAA o AAAA-MM-DD
- **Descripción**: Concepto del movimiento
- **Cargo** o **Abono**: Monto de la operación

💡 **Tip**: La mayoría de los bancos permiten descargar el estado de cuenta en formato CSV o Excel.

#### Cargar el Archivo

1. Haz clic en **"Seleccionar archivo CSV"**
2. Elige tu archivo de estado de cuenta
3. El sistema detecta automáticamente las columnas
4. Revisa la vista previa
5. Haz clic en **"Cargar Movimientos"**

### Conciliación Automática

El sistema ejecuta automáticamente un algoritmo de coincidencia que compara:

1. **Monto exacto** (peso: 50%)
2. **Fecha cercana** ±3 días (peso: 30%)
3. **Descripción similar** (peso: 20%)

**Nivel de Confianza:**
- 🟢 **Alta (>80%)**: Muy probable que sea la misma operación
- 🟡 **Media (60-80%)**: Posible coincidencia, revisar
- 🔴 **Baja (<60%)**: Revisar manualmente

### Revisar Coincidencias

1. Ve a la pestaña **"Coincidencias"**
2. Revisa cada coincidencia sugerida
3. **Verifica** las correctas (botón verde ✓)
4. **Rechaza** las incorrectas (botón rojo ✗)

### Conciliación Manual

Para movimientos sin coincidencia automática:

1. Ve a la pestaña **"Movimientos Bancarios"**
2. Filtra por **"Sin conciliar"**
3. Haz clic en **"Conciliar"** en el movimiento
4. Selecciona la transacción correspondiente
5. Confirma la conciliación

### Dashboard de Conciliación

La pestaña **"Resumen"** te muestra:
- Total de movimientos bancarios
- Movimientos conciliados
- Movimientos pendientes
- Tasa de conciliación (%)
- Alertas de discrepancias

**Meta recomendada**: >90% de conciliación

---

## Cálculos Fiscales

El módulo de cálculos fiscales automatiza el cálculo de tu **ISR provisional mensual** e **IVA definitivo mensual**.

### Acceso

Ve a **Fiscal** → **Cálculos Fiscales**

### Pestaña: Calcular

#### Seleccionar Período

1. Selecciona el **año** y **mes** que deseas calcular
2. Haz clic en **"Calcular ISR e IVA"**
3. El sistema procesa todas tus transacciones del período

#### Cálculo de ISR Provisional

El sistema calcula tu ISR siguiendo estos pasos:

1. **Ingresos acumulados**: Suma todos tus ingresos desde enero hasta el mes actual
2. **Deducciones autorizadas**: Suma todos tus gastos deducibles acumulados
3. **Base gravable**: Ingresos - Deducciones
4. **ISR según tarifa**: Aplica la tarifa progresiva del Art. 96 LISR
5. **Retenciones**: Resta las retenciones que te hicieron
6. **Pagos provisionales previos**: Resta los ISR pagados en meses anteriores
7. **ISR a pagar del mes**: Resultado final

**Ejemplo para marzo 2025:**

```
Ingresos enero-marzo: $180,000
Deducciones enero-marzo: $60,000
Base gravable: $120,000

Aplicando tarifa progresiva:
- Primeros $7,735 × 1.92% = $148.51
- Siguientes $57,765 × 6.40% = $3,696.96
- Siguientes $54,500 × 10.88% = $5,929.60
Total ISR: $9,775.07

Menos retenciones: -$5,000
Menos pagos previos: -$2,500
ISR a pagar en marzo: $2,275.07
```

#### Cálculo de IVA Definitivo

El IVA se calcula mensualmente:

1. **IVA trasladado**: IVA que cobraste a tus clientes
2. **IVA acreditable**: IVA que pagaste en gastos deducibles
3. **IVA a pagar**: IVA trasladado - IVA acreditable
4. **Saldo a favor mes anterior**: Si aplica
5. **IVA definitivo**: Resultado final

**Ejemplo para marzo 2025:**

```
IVA trasladado (cobrado): $28,800
IVA acreditable (pagado): $9,600
IVA a pagar: $19,200

Saldo a favor febrero: $0
IVA definitivo marzo: $19,200
```

### Pestaña: Historial

Aquí puedes ver todos los cálculos realizados:
- Período (mes/año)
- ISR calculado
- IVA calculado
- Estado (Calculado, Pagado, Pendiente)
- Fecha de cálculo

### Pestaña: Reportes

#### Reporte Mensual
Detalle completo de un mes específico:
- Todas las transacciones incluidas
- Desglose de ingresos y gastos
- Cálculo detallado de ISR
- Cálculo detallado de IVA
- Comprobantes fiscales asociados

#### Reporte Anual
Resumen de todo el año:
- ISR e IVA de cada mes
- Totales anuales
- Retenciones acumuladas
- Pagos provisionales realizados

---

## Declaraciones SAT

### DIOT (Declaración Informativa de Operaciones con Terceros)

La DIOT es un reporte mensual de todas tus operaciones con proveedores.

#### Acceso
Ve a **Fiscal** → **Declaraciones SAT** → pestaña **"DIOT"**

#### Generar DIOT

1. Selecciona el **mes** y **año**
2. Haz clic en **"Vista Previa de DIOT"**
3. Revisa la lista de operaciones con terceros
4. Verifica que todos los RFC sean correctos
5. Haz clic en **"Generar DIOT"**
6. Descarga el archivo TXT generado

#### ¿Qué Incluye la DIOT?

La DIOT agrupa tus operaciones por proveedor:
- RFC del proveedor
- Nombre o razón social
- País de residencia
- Tipo de operación (servicios, arrendamiento, etc.)
- Monto total de operaciones
- IVA retenido (si aplica)
- IVA pagado

#### Presentar la DIOT

1. Descarga el archivo TXT generado
2. Ingresa al portal del SAT
3. Ve a **"Declaraciones"** → **"DIOT"**
4. Carga el archivo TXT
5. Revisa y envía

**Fecha límite**: Día 17 del mes siguiente

### Contabilidad Electrónica (Anexo 24)

La Contabilidad Electrónica son cuatro archivos XML mensuales que debes enviar al SAT.

#### Acceso
Ve a **Fiscal** → **Declaraciones SAT** → pestaña **"Contabilidad Electrónica"**

#### Los 4 Archivos XML

1. **Catálogo de Cuentas**
   - Tu catálogo contable según el agrupador del SAT
   - Se genera una vez y se actualiza solo si cambias cuentas

2. **Balanza de Comprobación**
   - Balance mensual de todas tus cuentas
   - Saldos iniciales, movimientos y saldos finales

3. **Pólizas**
   - Detalle de todas tus transacciones del mes
   - Asientos contables

4. **Auxiliar de Folios**
   - Todos tus CFDIs del mes
   - Relacionados con las pólizas correspondientes

#### Generar Contabilidad Electrónica

1. Selecciona el **mes** y **año**
2. Revisa la vista previa de cada archivo
3. Haz clic en **"Generar Todos los XMLs"**
4. Descarga los 4 archivos XML generados

#### Enviar al SAT

1. Ingresa al portal del SAT
2. Ve a **"Trámites"** → **"Contabilidad Electrónica"**
3. Sube los 4 archivos XML
4. Valida y envía

**Fecha límite**: 
- Personas con ingresos <$4M: Día 25 del mes siguiente
- Personas con ingresos ≥$4M: Día 17 del mes siguiente

---

## Declaración Anual

La Declaración Anual integra todos tus ingresos, gastos y deducciones personales del año para calcular tu ISR definitivo.

### Acceso

Ve a **Fiscal** → **Declaración Anual**

### Pestaña: Generar

#### Paso 1: Seleccionar Año

Selecciona el año fiscal que deseas declarar (por ejemplo, 2024 para la declaración de abril 2025).

#### Paso 2: Revisar Resumen Anual

El sistema muestra automáticamente:

**Ingresos Totales**
- Suma de todos tus ingresos del año
- Desglose por mes

**Gastos Totales**
- Suma de todos tus gastos del año
- Desglose por mes

**Deducciones Autorizadas**
- Solo gastos estrictamente deducibles
- Desglose por categoría

**ISR Provisional Pagado**
- Suma de todos tus pagos provisionales mensuales
- Retenciones que te hicieron

**IVA Anual**
- Total IVA cobrado
- Total IVA pagado
- Saldo neto

#### Paso 3: Agregar Deducciones Personales

Las deducciones personales reducen tu base gravable hasta cierto límite.

##### Tipos de Deducciones Personales

1. **Gastos Médicos y Dentales**
   - Honorarios médicos
   - Gastos hospitalarios
   - Medicinas (con receta)
   - Prótesis, análisis, lentes
   - **Límite**: Sin límite, pero la suma total de todas las deducciones no puede exceder 5 UMA anuales ni 15% de tus ingresos

2. **Gastos Funerarios**
   - Solo de tu cónyuge o familiar en línea recta
   - **Límite**: 1 UMA anual

3. **Donativos**
   - A instituciones autorizadas por el SAT
   - **Límite**: 7% de ingresos acumulados del año anterior

4. **Intereses de Crédito Hipotecario**
   - Solo tu casa habitación
   - **Límite**: 750,000 UDIS

5. **Aportaciones Voluntarias a Retiro**
   - Plan Personal de Retiro (PPR)
   - **Límite**: 10% de tus ingresos anuales o 5 UMA anuales

6. **Primas de Seguros de Gastos Médicos**
   - Solo del contribuyente, cónyuge o ascendientes/descendientes en línea recta
   - **Límite**: Incluido en el límite general

7. **Gastos de Transporte Escolar**
   - Solo si es obligatorio por el colegio
   - **Límite**: Incluido en el límite general

8. **Colegiaturas**
   - Desde preescolar hasta preparatoria
   - **Límites anuales por nivel**:
     * Preescolar: $14,200
     * Primaria: $12,900
     * Secundaria: $19,900
     * Profesional técnico: $17,100
     * Bachillerato: $24,500

##### Agregar una Deducción Personal

1. En la sección **"Deducciones Personales"**, haz clic en **"+"**
2. Selecciona el tipo de deducción
3. Ingresa el monto total del año
4. Agrega una descripción (opcional)
5. Haz clic en **"Agregar"**

El sistema calcula automáticamente:
- Si la deducción está dentro del límite
- El límite general de deducciones personales (menor de 5 UMA o 15% de ingresos)
- Las deducciones que efectivamente puedes aplicar

#### Paso 4: Generar la Declaración

1. Revisa todos los datos
2. Haz clic en **"Generar Declaración Anual"**
3. El sistema calcula:
   - ISR anual con deducciones personales
   - Saldo a favor o a cargo
   - IVA anual definitivo

### Pestaña: Historial

Lista de todas las declaraciones generadas:
- Año fiscal
- Fecha de generación
- ISR a pagar / Saldo a favor
- IVA a pagar / Saldo a favor
- Estado (Generada, Presentada, Aceptada)

### Pestaña: Detalles

Ver el desglose completo de una declaración:
- Ingresos mensuales
- Deducciones autorizadas mensuales
- Deducciones personales aplicadas
- Cálculo detallado del ISR anual
- Cálculo del IVA anual
- Pagos provisionales aplicados
- Resultado final

### Presentar la Declaración

1. Descarga el detalle de la declaración en PDF
2. Ingresa al portal del SAT
3. Ve a **"Declaraciones"** → **"Anual de personas físicas"**
4. Captura manualmente los datos (el SAT no permite importar)
5. El SAT pre-carga algunos datos (ingresos, retenciones)
6. Verifica que coincidan con tu sistema
7. Envía la declaración

**Fecha límite**: 30 de abril del año siguiente

**¡IMPORTANTE!** Siempre verifica los datos con tu contador antes de presentar.

---

## Archivo Digital

El Archivo Digital te permite organizar y almacenar todos tus documentos fiscales de forma segura.

### Acceso

Ve a **Fiscal** → **Archivo Digital**

### Tipos de Documentos

- 📄 **CFDI**: Facturas electrónicas (XML)
- 🧾 **Recibo**: Comprobantes no fiscales
- 📝 **Factura**: Facturas de proveedores extranjeros
- 📊 **Declaración**: Acuses de declaraciones presentadas
- 🏦 **Estado de Cuenta**: Estados de cuenta bancarios
- 📑 **Contrato**: Contratos con clientes/proveedores
- 📈 **Reporte**: Reportes fiscales o contables
- 📋 **Otro**: Otros documentos relevantes

### Subir Documentos

1. Haz clic en **"Subir Documento"**
2. Selecciona el archivo (PDF, XML, JPG, PNG)
3. Completa los metadatos:
   - **Tipo de documento**
   - **Nombre descriptivo**
   - **Período fiscal** (mes/año)
   - **Etiquetas** (para organización)
   - **Nivel de acceso** (público, privado, confidencial)
   - **Período de retención** (años a conservar)

4. Opcionalmente, vincula a transacción o declaración relacionada
5. Haz clic en **"Guardar"**

### Características del Archivo

#### Seguridad
- **Hash SHA-256**: Cada documento tiene un hash único para verificar integridad
- **Detección de duplicados**: No se pueden subir dos veces el mismo archivo
- **Control de acceso**: Diferentes niveles de privacidad

#### Organización
- **Búsqueda por texto**: Encuentra documentos por nombre o contenido
- **Filtros**:
  - Por tipo de documento
  - Por etiquetas
  - Por período fiscal
  - Por estado
- **Etiquetas personalizadas**: Crea tus propias etiquetas

#### Retención
- **Período de retención**: Define cuántos años guardar cada documento
- **Alertas de expiración**: Te avisa cuando un documento está por expirar
- **Estados**: Activo, Archivado, Expirado

### Requisitos SAT de Retención

Según el SAT, debes conservar:
- **CFDIs**: 5 años
- **Contabilidad**: 5 años
- **Declaraciones**: 5 años
- **Estados de cuenta**: 5 años

💡 **Tip**: El sistema sugiere automáticamente el período de retención según el tipo de documento.

---

## Monitoreo de Cumplimiento

El Monitoreo de Cumplimiento evalúa en tiempo real qué tan bien cumples con las obligaciones fiscales.

### Acceso

Ve a **Fiscal** → **Monitoreo de Cumplimiento**

### Pestaña: Dashboard

#### Puntaje de Cumplimiento (0-100)

El sistema calcula un puntaje basado en:

1. **Cobertura de CFDIs (15 puntos)**
   - % de transacciones con CFDI respecto al total
   - Meta: ≥80%

2. **Gastos >$2,000 con CFDI (10 puntos)**
   - % de gastos mayores a $2,000 que tienen CFDI
   - Meta: ≥95%

3. **Conciliación Bancaria (10 puntos)**
   - % de transacciones conciliadas con estado de cuenta
   - Meta: ≥90%

4. **Cálculos Fiscales (20 puntos)**
   - Mes actual calculado: 20 puntos
   - Mes actual sin calcular: 0 puntos

5. **Deducciones Personales (Recomendación)**
   - Te sugiere revisar si tienes deducciones pendientes
   - No afecta el puntaje, pero puede reducir tu ISR

#### Interpretación del Puntaje

| Puntaje | Estado | Acción |
|---------|--------|--------|
| 90-100 | 🟢 **Cumplimiento** | Excelente, sigue así |
| 70-89 | 🟡 **Alerta** | Mejorar algunas áreas |
| 50-69 | 🟠 **No Cumplimiento** | Atención requerida |
| 0-49 | 🔴 **Crítico** | Acción inmediata |

### Pestaña: Alertas

Lista de todas las alertas activas con:
- **Severidad**: Crítica, Alta, Media, Baja
- **Tipo**: CFDI, Conciliación, Cálculo, etc.
- **Descripción** del problema
- **Recomendación** para resolver
- **Fecha** de detección

#### Tipos de Alertas Comunes

**Críticas:**
- Mes sin cálculo fiscal
- Gastos >$2,000 sin CFDI
- Declaración vencida sin presentar

**Altas:**
- Cobertura de CFDIs <80%
- Conciliación bancaria <90%
- Gastos importantes sin recibo

**Medias:**
- Algunas transacciones sin conciliar
- CFDIs no vinculados
- Categorización pendiente

**Bajas:**
- Sugerencias de optimización
- Recordatorios de mejores prácticas

### Pestaña: Historial

Registro de todas las verificaciones de cumplimiento realizadas:
- Fecha de la verificación
- Puntaje obtenido
- Alertas generadas
- Alertas resueltas

### Pestaña: Reportes

Genera reportes de cumplimiento en PDF:
- Reporte mensual de cumplimiento
- Reporte anual de cumplimiento
- Reporte de alertas críticas

---

## Análisis Fiscal

El módulo de Análisis Fiscal te proporciona insights sobre tu situación fiscal y oportunidades de optimización.

### Acceso

Ve a **Fiscal** → **Análisis Fiscal**

### Pestaña: Vista General

#### Resumen Mensual
- Total de transacciones
- Ingresos y gastos
- Deducibilidad efectiva (%)
- ISR e IVA calculados
- Puntaje de cumplimiento

#### Resumen Anual
- Totales del año a la fecha
- Desglose mensual
- Promedio mensual
- Proyección anual

### Pestaña: Tendencias

#### Análisis de Tendencias Mensuales
- **Ingresos promedio** mensual
- **Gastos promedio** mensual
- **ISR promedio** mensual
- **Tasa efectiva de ISR** (%)

#### Proyección Anual
Basada en los promedios mensuales:
- Ingresos proyectados del año
- Gastos proyectados del año
- ISR proyectado del año

#### Análisis de Crecimiento
Comparación mes a mes:
- % de crecimiento en ingresos
- % de crecimiento en gastos
- % de crecimiento en utilidad

### Pestaña: Cumplimiento

#### Puntaje Detallado
Desglose del puntaje de cumplimiento por categoría:
- CFDIs
- Conciliación bancaria
- Cálculos fiscales
- Deducciones personales

#### Problemas Detectados
Lista de todos los problemas con:
- Descripción
- Severidad
- Recomendación
- Estado (Pendiente/Resuelto)

### Pestaña: Optimización

#### Sugerencias de Optimización Fiscal

El sistema analiza tus datos y te sugiere:

1. **Mejorar Cobertura de CFDIs**
   - Si tu cobertura es <80%
   - Prioridad: Alta
   - Ahorro potencial: Evitar rechazos en auditorías

2. **Revisar Deducciones Personales**
   - Si no has capturado deducciones
   - Prioridad: Alta
   - Ahorro potencial: Calculado según tus ingresos

3. **Optimizar Métodos de Pago**
   - Si tienes pagos en efectivo >$2,000
   - Prioridad: Media
   - Ahorro: Mantener deducibilidad

4. **Planificación Fiscal**
   - Sugerencias para los próximos meses
   - Prioridad: Baja
   - Ahorro potencial: Optimizar cargas fiscales

#### Ahorro Fiscal Estimado

El sistema calcula el ahorro potencial si:
- Mejoras tu cobertura de CFDIs
- Aplicas todas las deducciones personales disponibles
- Optimizas tus gastos deducibles

---

## Configuración Fiscal

### Acceso

Ve a **Fiscal** → **Configuración Fiscal**

### UMA (Unidad de Medida y Actualización)

El UMA se utiliza para calcular límites de deducciones y obligaciones fiscales.

**Valores 2025:**
- UMA Diario: $113.14
- UMA Mensual: $3,439.46
- UMA Anual: $41,273.52

Estos valores se actualizan automáticamente cada año.

### Catálogo de Cuentas SAT

El sistema incluye el catálogo oficial del SAT (Anexo 24) con más de 200 cuentas organizadas en 7 niveles jerárquicos.

**Estructura:**
1. Activo / Pasivo / Capital / Ingresos / Gastos
2. Circulante / Fijo / Diferido / etc.
3. Subcategorías específicas
4. Hasta 7 niveles de detalle

Puedes:
- **Buscar** cuentas por código o nombre
- **Filtrar** por nivel o tipo
- **Ver jerarquía** completa

### Tarifas ISR

El sistema usa las tarifas oficiales del SAT para 2025 (Art. 96 y 152 LISR).

**Tarifa Mensual (Provisional):**
| Límite Inferior | Límite Superior | Cuota Fija | % s/Excedente |
|----------------|-----------------|-----------|----------------|
| $0.01 | $7,735.00 | $0.00 | 1.92% |
| $7,735.01 | $65,651.07 | $148.51 | 6.40% |
| $65,651.08 | $115,375.90 | $3,855.17 | 10.88% |
| ... | ... | ... | ... |

### Configurar tu Perfil Fiscal

1. RFC
2. Régimen fiscal (Persona Física con Actividad Empresarial)
3. Actividad preponderante
4. Obligaciones fiscales

---

## Mejores Prácticas

### 1. Registro Diario
✅ Registra tus transacciones diariamente
✅ No dejes acumular semanas de operaciones
✅ Es más fácil recordar detalles cuando son recientes

### 2. CFDI al Instante
✅ Carga tus CFDIs apenas los recibes
✅ Vincúlalos inmediatamente a las transacciones
✅ Evita tener CFDIs sueltos

### 3. Conciliación Mensual
✅ Concilia tu banco al finalizar cada mes
✅ Verifica que todo esté registrado
✅ Identifica discrepancias temprano

### 4. Cálculo Mensual Oportuno
✅ Calcula tu ISR e IVA antes del día 10 del mes siguiente
✅ Revisa las cifras antes de presentar
✅ Así tienes tiempo de corregir errores

### 5. Declaraciones a Tiempo
✅ DIOT: Antes del día 17
✅ Contabilidad Electrónica: Antes del día 25
✅ Declaración Anual: Antes del 30 de abril

### 6. Backup Regular
✅ Descarga tus reportes mensualmente en PDF
✅ Guarda copias de tus XMLs fuera del sistema
✅ Exporta tu base de datos periódicamente

### 7. Clasificación Correcta
✅ Usa categorías consistentes
✅ Marca correctamente la deducibilidad
✅ No mezcles gastos personales con empresariales

### 8. Documentación Completa
✅ Agrega notas descriptivas a transacciones importantes
✅ Guarda evidencias de pagos (comprobantes bancarios)
✅ Archiva contratos y acuerdos

### 9. Revisión Mensual
✅ Revisa el puntaje de cumplimiento mensualmente
✅ Atiende alertas críticas inmediatamente
✅ Mejora áreas en alerta

### 10. Asesoría Profesional
✅ Consulta con tu contador al cerrar el año
✅ Pide revisión antes de la declaración anual
✅ Mantén comunicación constante

---

## Solución de Problemas

### No Puedo Cargar un CFDI

**Problema:** El sistema no acepta mi archivo XML

**Soluciones:**
1. Verifica que sea un archivo .xml válido (no .zip, .rar, etc.)
2. Abre el XML en un editor de texto para verificar que no esté corrupto
3. Verifica que el XML contenga etiquetas de CFDI (cfdi:Comprobante)
4. Si descargaste el XML del SAT, asegúrate de que esté completo

### El CFDI Muestra "RFC Inválido"

**Problema:** El sistema marca el CFDI con error de RFC

**Soluciones:**
1. Verifica que tu RFC en el sistema sea correcto (ve a Configuración)
2. Verifica que el RFC en el XML coincida exactamente con el tuyo
3. Si es un CFDI de proveedor, verifica el RFC del emisor

### No Encuentra Coincidencias en Conciliación

**Problema:** El sistema no concilia automáticamente movimientos bancarios

**Soluciones:**
1. Verifica que las transacciones estén registradas
2. Revisa que los montos sean exactos (sin decimales extra)
3. Verifica que las fechas sean cercanas (±3 días)
4. Usa conciliación manual para casos difíciles

### El Cálculo de ISR Parece Incorrecto

**Problema:** El ISR calculado no coincide con tus expectativas

**Soluciones:**
1. Verifica que todas las transacciones del período estén registradas
2. Revisa la clasificación de deducibilidad de gastos
3. Verifica que los ingresos incluyan todos los meses del año hasta el actual
4. Consulta el desglose detallado en la pestaña "Reportes"
5. Si persiste la duda, consulta con tu contador

### No Puedo Generar la DIOT

**Problema:** El botón de generar DIOT no funciona o da error

**Soluciones:**
1. Verifica que todas las operaciones del mes tengan RFC del proveedor
2. Verifica que los RFC tengan formato válido
3. Revisa que las operaciones tengan tipo de operación definido
4. Si hay proveedores sin RFC (extranjeros), marca como tal

### El Puntaje de Cumplimiento es Bajo

**Problema:** Tu puntaje de cumplimiento está en rojo o amarillo

**Soluciones:**
1. Revisa la pestaña "Alertas" para ver qué falta
2. Prioriza alertas críticas y altas
3. Sube los CFDIs faltantes
4. Concilia las transacciones pendientes
5. Realiza los cálculos fiscales del mes actual
6. Revisa el dashboard para ver áreas específicas a mejorar

### Error al Subir Documento al Archivo

**Problema:** No puedo subir un documento al archivo digital

**Soluciones:**
1. Verifica el tamaño del archivo (máximo 10 MB)
2. Verifica el formato (PDF, XML, JPG, PNG permitidos)
3. Si es muy grande, comprímelo o reduce la calidad
4. Verifica tu conexión a internet

### No Veo Mis Transacciones

**Problema:** La lista de transacciones está vacía o faltan algunas

**Soluciones:**
1. Revisa los filtros activos (fecha, tipo, categoría)
2. Haz clic en "Limpiar filtros" para ver todo
3. Verifica que estás viendo el rango de fechas correcto
4. Si acabas de importar, recarga la página

---

## Soporte Adicional

### Recursos en Línea

- **Portal del SAT**: https://www.sat.gob.mx
- **Normatividad**: LISR, LIVA, CFF
- **Mis Cuentas SAT**: Para verificar información

### Glosario de Términos

- **CFDI**: Comprobante Fiscal Digital por Internet (factura electrónica)
- **ISR**: Impuesto Sobre la Renta
- **IVA**: Impuesto al Valor Agregado
- **RFC**: Registro Federal de Contribuyentes
- **UMA**: Unidad de Medida y Actualización
- **DIOT**: Declaración Informativa de Operaciones con Terceros
- **PUE**: Pago en Una Exhibición
- **PPD**: Pago en Parcialidades o Diferido
- **UUID**: Folio fiscal único del CFDI

### Actualizaciones del Sistema

Este sistema se actualiza regularmente con:
- Nuevas tarifas de ISR (anualmente)
- Nuevos valores de UMA (anualmente)
- Mejoras en funcionalidad
- Correcciones de errores

Revisa las notas de versión para conocer las novedades.

---

**Última actualización**: Octubre 19, 2025  
**Versión del sistema**: 1.0  
**Fase de implementación**: 24 (Verificación y Documentación)

Para soporte técnico o preguntas adicionales, contacta a tu administrador del sistema o contador.
