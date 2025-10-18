# Guía de Deducibilidad Fiscal Granular - Avanta Finance

## ¿Qué es la Deducibilidad Granular?

A partir de la Fase 16, Avanta Finance ofrece un sistema sofisticado para clasificar tus gastos con reglas de deducibilidad precisas según las regulaciones del SAT para Personas Físicas con Actividad Empresarial.

## Características Principales

### 1. Control Granular por Gasto

Cada gasto ahora puede tener:

- **✅ Deducible ISR**: Marca si el gasto es deducible para Impuesto Sobre la Renta
- **✅ IVA Acreditable**: Marca si el IVA del gasto es acreditable
- **📋 Tipo de Gasto**: Clasifica el gasto como:
  - **Nacional**: Gastos en México con factura mexicana
  - **Internacional con Factura**: Gastos en el extranjero con factura mexicana
  - **Internacional sin Factura**: Gastos en el extranjero sin factura mexicana

### 2. Indicadores Visuales

En la tabla de transacciones verás:
- 🔵 **Badge ISR**: Cuando el gasto es deducible para ISR
- 🟢 **Badge IVA**: Cuando el IVA es acreditable
- 🌍 **Badge Internacional**: Para gastos internacionales

### 3. Reglas Automáticas de Deducibilidad

Crea reglas personalizadas para clasificar automáticamente tus gastos.

## Cómo Usar el Sistema

### Agregar una Transacción con Deducibilidad Granular

1. Ve a **Transacciones** → **Agregar Transacción**
2. Llena los datos básicos (fecha, descripción, monto, tipo)
3. En la sección **"Deducibilidad Fiscal"** (solo para gastos):
   - Marca ✅ **Deducible ISR** si el gasto es deducible para ISR
   - Marca ✅ **IVA Acreditable** si el IVA es acreditable
   - Selecciona el **Tipo de Gasto** apropiado
4. Guarda la transacción

### Crear Reglas de Deducibilidad

1. Ve al menú **Fiscal** → **Reglas de Deducibilidad**
2. Haz clic en **"Nueva Regla"**
3. Completa el formulario:

#### Información Básica
- **Nombre**: Dale un nombre descriptivo a la regla
- **Descripción**: Explica para qué sirve la regla
- **Prioridad**: Define el orden de evaluación (mayor = primero)
- **Activa**: Marca si la regla está activa

#### Criterios de Coincidencia (Opcional)
Define cuándo aplicar la regla:
- **Categoría**: Selecciona una categoría específica
- **Palabras clave**: Lista de palabras separadas por comas (ej: "uber, taxi, transporte")
- **Monto mínimo/máximo**: Define rangos de montos
- **Tipo de transacción**: Negocio, Personal, o Transferencia
- **Tipo de gasto**: Nacional o Internacional

#### Acciones (Requerido - al menos una)
Define qué hacer cuando la regla coincida:
- **ISR Deducible**: Sí / No / Sin cambio
- **IVA Acreditable**: Sí / No / Sin cambio
- **Establecer tipo de gasto**: Nacional / Internacional con/sin factura

#### Ejemplo de Reglas Útiles

**Regla 1: Gastos de Transporte**
- Nombre: "Transporte Urbano - Deducible"
- Palabras clave: "uber, didi, taxi, transporte"
- ISR Deducible: Sí
- IVA Acreditable: Sí
- Tipo de gasto: Nacional

**Regla 2: Gastos Internacionales sin Factura**
- Nombre: "Internacional sin Factura - IVA No Deducible"
- Tipo de gasto (criterio): internacional_no_invoice
- IVA Acreditable: No

**Regla 3: Gastos Personales**
- Nombre: "Gastos Personales - No Deducibles"
- Tipo de transacción: Personal
- ISR Deducible: No
- IVA Acreditable: No

## Cumplimiento SAT

### ¿Por qué separar ISR y IVA?

El SAT tiene requisitos diferentes para la deducibilidad de ISR y el acreditamiento de IVA:

**Para ISR:**
- El gasto debe ser estrictamente indispensable
- Debe estar amparado con CFDI
- Debe cumplir con requisitos fiscales

**Para IVA:**
- Además de los requisitos de ISR
- El bien/servicio debe usarse para actividades gravadas con IVA
- El pago debe estar efectivamente realizado
- **Gastos internacionales sin factura mexicana NO permiten acreditar IVA**

### Tipos de Gasto según SAT

1. **Nacional**: 
   - Gastos en México
   - Con factura mexicana (CFDI)
   - Ambos ISR e IVA pueden ser deducibles si cumplen requisitos

2. **Internacional con Factura**:
   - Gastos en el extranjero
   - Con factura mexicana o comprobante válido
   - Puede ser deducible para ISR
   - IVA acreditable si cumple requisitos

3. **Internacional sin Factura**:
   - Gastos en el extranjero
   - Sin factura mexicana
   - Puede ser deducible para ISR si cumple otros requisitos
   - **IVA NO es acreditable** (importante para SAT)

## Cálculos Fiscales

El módulo de **Fiscal** ahora muestra:
- Gastos deducibles para ISR
- Gastos con IVA acreditable
- Porcentaje de deducibilidad ISR
- Porcentaje de acreditamiento IVA

Esto te da una visión más precisa de tu situación fiscal.

## Retrocompatibilidad

- Las transacciones existentes se migraron automáticamente
- Si una transacción estaba marcada como "Deducible", ahora aparece con ISR e IVA deducibles
- Puedes editar transacciones antiguas para ajustar la deducibilidad granular

## Preguntas Frecuentes

**P: ¿Debo marcar ambos ISR e IVA siempre?**
R: No necesariamente. Algunos gastos pueden ser deducibles para ISR pero no para IVA (ej: gastos internacionales sin factura).

**P: ¿Qué pasa si no marco ninguno?**
R: El gasto se registra pero no se considera deducible para cálculos fiscales.

**P: ¿Las reglas se aplican automáticamente?**
R: Las reglas están diseñadas para aplicación futura. En esta fase, debes seleccionar manualmente la deducibilidad al crear transacciones.

**P: ¿Puedo cambiar la deducibilidad después?**
R: Sí, puedes editar cualquier transacción y cambiar sus propiedades de deducibilidad.

**P: ¿Cómo sé qué gastos son deducibles?**
R: Consulta el documento REQUISITOS SAT.md en el repositorio o contacta a tu contador. La aplicación te ayuda a clasificar, pero la responsabilidad fiscal es tuya.

## Soporte

Para dudas o problemas:
1. Revisa la documentación del SAT
2. Consulta con tu contador
3. Revisa el archivo REQUISITOS SAT.md
4. Contacta al soporte técnico de Avanta Finance

---

**Nota**: Este sistema es una herramienta de ayuda. Siempre consulta con un profesional en materia fiscal para asegurar el cumplimiento correcto de tus obligaciones con el SAT.
