# Reglas Completas del SAT para Personas Físicas con Actividad Empresarial: Especificación Técnica para Implementación

Esta es una especificación técnica exhaustiva de todas las reglas del SAT aplicables a tu situación fiscal, diseñada para que tanto tú como un agente de IA puedan entender completamente la mecánica fiscal mexicana y desarrollar un sistema de contabilidad preciso.[1][2][3]

## I. Marco Legal Fundamental

### Legislación Aplicable

Tu régimen fiscal está regulado por:[2][1]

- **Ley del Impuesto Sobre la Renta (LISR)**: Título IV, Capítulo II, Sección I (Artículos 100-110)
- **Código Fiscal de la Federación (CFF)**: Reglas generales de obligaciones y comprobantes
- **Resolución Miscelánea Fiscal (RMF)**: Reglas administrativas actualizadas anualmente
- **Código Fiscal de la Federación Art. 32**: Declaraciones complementarias

### Tu Situación Fiscal Específica

Según tu CSF:[3]
- **RFC**: REGM000905T24
- **Régimen**: 612 - Personas Físicas con Actividades Empresariales y Profesionales
- **Fecha inicio operaciones**: 27 de agosto de 2019
- **Actividades económicas**: 7 registradas (producción audiovisual, comercio electrónico, servicios digitales, etc.)
- **Obligaciones**: ISR, IVA, retenciones

## II. Reglas de Reconocimiento de Ingresos (Artículos 100-102 LISR)

### Regla 1: Ingresos Acumulables Base (Art. 100)

**Definición**: Todos los ingresos derivados de actividades empresariales o prestación de servicios profesionales son gravables.[1][2]

**Incluye**:
- Actividades comerciales
- Actividades industriales
- Prestación de servicios profesionales independientes
- Servicios digitales
- Producción audiovisual
- Comercio electrónico

**Consideración para el sistema**: Cada ingreso debe clasificarse por tipo de actividad para trazabilidad fiscal.

### Regla 2: Ingresos Adicionales Acumulables (Art. 101)

**Además de ingresos por ventas/servicios, son acumulables**:[2][1]

1. **Condonaciones de deuda**: Cuando un acreedor perdona una deuda relacionada con tu actividad empresarial
   - **Cálculo**: Principal actualizado por inflación menos monto condonado
   - **Excepción**: Pérdidas fiscales pueden disminuirse primero

2. **Enajenación de cuentas por cobrar**: Venta de facturas por cobrar (factoraje)
   - **Momento**: Cuando se recibe el pago por la venta

3. **Recuperaciones de seguros**: Indemnizaciones por pérdidas de bienes empresariales
   - **Acumulable**: El monto recuperado menos lo ya deducido

4. **Gastos por cuenta de terceros sin comprobante**: Si cobras gastos a clientes pero no respaldan con CFDI a nombre del cliente
   - **Regla crítica**: Solo no es acumulable si el CFDI está a nombre del cliente final

5. **Enajenación de obras de arte creadas por ti**: Si produces contenido audiovisual y lo vendes
   - **Acumulable**: Precio total de venta

6. **Explotación de derechos de autor**: Regalías, licencias de contenido digital
   - **Acumulable**: Cada pago recibido

7. **Intereses cobrados**: Intereses por financiamiento a clientes
   - **Regla**: Sin ajuste por inflación (nominal)

8. **Devoluciones, descuentos y bonificaciones recibidas**: Si previamente dedujiste el gasto
   - **Lógica**: Reversa de la deducción original

9. **Ganancia en venta de activos fijos**: Venta de equipo, vehículos, inmuebles afectos a la actividad
   - **Cálculo**: Precio de venta menos valor pendiente de deducir

**Consideración para el sistema**: Cada tipo de ingreso debe tener su propio código de clasificación y regla de acumulación específica.

### Regla 3: Momento de Acumulación - Principio de "Efectivamente Percibido" (Art. 102)

**Regla fundamental**: Los ingresos se acumulan cuando se perciben efectivamente, NO cuando se facturan.[1][2]

**Definición de "efectivamente percibido"**:

1. **Efectivo**: El día que recibes el dinero físico
2. **Transferencia bancaria**: El día que aparece en tu cuenta
3. **Cheque**: El día que lo cobras en el banco (o lo endosas a tercero, salvo endoso en procuración)
4. **Bienes o servicios**: El día que los recibes como pago
5. **Títulos de crédito**: Cuando los recibes (excepto cheques)
6. **Cualquier forma de extinción de obligación**: Cuando el cliente queda liberado (compensación, novación, etc.)

**Casos especiales**:

**Anticipos y depósitos**: Se acumulan cuando se reciben, aunque no se haya entregado el bien o servicio.[1]

**Exportaciones**: Se acumulan cuando efectivamente cobras. Si no cobras en 12 meses posteriores a la exportación, debes acumular el ingreso automáticamente al cumplirse 12 meses.[1]

**Condonaciones de deuda**: El día que se firma el convenio de condonación.[1]

**Consideración crítica para el sistema**: 
- Debe haber dos fechas: **fecha de factura** y **fecha de cobro efectivo**
- Los ingresos se acumulan fiscalmente por **fecha de cobro**, no por fecha de factura
- Si facturas en diciembre pero cobras en enero del siguiente año, el ingreso es del año siguiente
- Esto afecta directamente el cálculo de pagos provisionales mensuales

## III. Reglas de Deducciones (Artículos 103-105 LISR)

### Regla 4: Deducciones Autorizadas (Art. 103)

**Lista exhaustiva de conceptos deducibles**:[2][1]

1. **Devoluciones, descuentos y bonificaciones hechas**: Si previamente acumulaste el ingreso
2. **Adquisición de mercancías**: Inventario para reventa
3. **Materias primas**: Para fabricación o prestación de servicios
4. **Gastos**: Cualquier erogación estrictamente indispensable
5. **Inversiones**: Activos fijos (equipo, vehículos, inmuebles) mediante depreciación
6. **Intereses pagados**: Por préstamos usados en la actividad empresarial (sin ajuste inflacionario)
7. **Cuotas patronales IMSS**: Si tienes empleados
8. **Impuestos locales**: Predial, tenencia, impuesto sobre nómina

**NO son deducibles** (aunque los compres para la empresa):[1]
- Terrenos (solo al venderlos, como costo de lo vendido)
- Acciones y valores mobiliares
- Moneda extranjera (solo al tipo de cambio en operación)
- Piezas de oro o plata (monedas o lingotes)
- Activos personales no empresariales

### Regla 5: Requisitos ABSOLUTOS de las Deducciones (Art. 105)

**Estas condiciones deben cumplirse TODAS simultáneamente** para que una deducción sea válida:[2][1]

#### Requisito 1: Efectivamente Erogado

**Definición de "efectivamente erogado"**:[1]

- **Efectivo**: El día que entregas el dinero
- **Transferencia bancaria**: El día que sale de tu cuenta
- **Cheque**: El día que el proveedor lo cobra (o lo endosas a tercero)
  - **Limitante temporal**: Entre fecha del CFDI y fecha de cobro del cheque no pueden pasar más de 4 meses
- **Bienes o servicios**: El día que entregas el bien o prestas el servicio
- **Títulos de crédito (excepto cheque)**: Cuando efectivamente se cobran
- **Cualquier extinción de obligación**: Compensación, novación, dación en pago

**Regla crítica para pagos a plazos**: Solo es deducible lo efectivamente pagado en cada mes/ejercicio.[1]

**Ejemplo práctico**:
- Compras equipo de $50,000 el 15 de marzo
- Das $10,000 de enganche y firmas 4 pagarés de $10,000 mensuales
- En marzo solo deduces $10,000 (activo fijo, se deprecia)
- Cada mes que pagas un pagaré, deduces otra porción

#### Requisito 2: Estrictamente Indispensable

**Definición**: El gasto debe ser necesario para generar ingresos o mantener la fuente productora de ingresos.[1]

**Prueba del SAT**: Si se elimina este gasto, ¿afectaría tu capacidad de generar ingresos?

**Ejemplos de indispensables**:
- Internet para servicios digitales
- Software de edición para producción audiovisual
- Materia prima para manufactura
- Gasolina si usas tu auto para visitar clientes

**Ejemplos de NO indispensables**:
- Ropa personal (salvo uniformes de trabajo)
- Entretenimiento personal
- Gastos de tu casa no relacionados con el negocio
- Multas de tránsito personales

**Consideración para el sistema**: Debe existir un campo de justificación de indispensabilidad, especialmente para gastos mixtos (uso personal + empresarial).

#### Requisito 3: Comprobante Fiscal Válido (CFDI)

**Requisitos del CFDI**:[4][1]

1. **Formato**: XML + PDF
2. **RFC emisor**: Válido y activo
3. **RFC receptor**: Tu RFC (REGM000905T24)
4. **UUID**: Folio fiscal único
5. **Fecha de emisión**: Dentro del ejercicio fiscal que se deduce
6. **Complemento de pago**: Si la factura es PPD (pago en parcialidades)
7. **Validación SAT**: El CFDI debe estar vigente (no cancelado)

**Plazo para obtener CFDI**: Puedes obtenerlo hasta el día que presentas tu declaración anual (30 de abril del año siguiente), pero la fecha de emisión debe ser del ejercicio que deduces.[1]

**Ejemplo**:
- Gastos de diciembre 2025
- Puedes solicitar facturas hasta 30 de abril 2026
- Pero las facturas deben tener fecha de diciembre 2025

#### Requisito 4: Deducción Única

**Regla**: No puedes deducir el mismo gasto dos veces, aunque esté relacionado con múltiples ingresos.[1]

**Ejemplo**: Internet que usas para dos negocios distintos, solo se deduce una vez (total).

#### Requisito 5: Seguros y Fianzas Conforme a Ley

**Regla especial**: Las primas de seguros solo son deducibles si:[1]
- La póliza no permite préstamos con garantía de las primas o reservas
- El concepto asegurado es deducible (seguro de auto, seguro de RC, etc.)
- Cumple con regulación de seguros mexicana

#### Requisito 6: Sin Revaluación de Activos

**Regla**: No puedes ajustar el valor de tus activos por inflación o valor de mercado para fines de deducción.[1]

**Ejemplo**: Compraste equipo en $100,000. Aunque ahora vale $150,000, solo deduces sobre los $100,000 originales.

#### Requisito 7: Deducciones sobre Base sin IVA

**Regla implícita**: Las deducciones de ISR se calculan sobre el monto **sin IVA**.[5][6]

**Ejemplo**:
- Factura de $11,600 total
- IVA: $1,600
- Base deducible ISR: $10,000
- IVA acreditable (otra cuenta): $1,600

### Regla 6: Inversiones y Depreciación (Art. 104)

**Regla fundamental**: Los activos fijos NO se deducen en su totalidad el año de compra. Se deducen mediante porcentajes anuales (depreciación fiscal).[1]

**Activos depreciables** (Art. 32-34 LISR):
- Edificios y construcciones
- Mobiliario y equipo de oficina
- Equipo de cómputo
- Vehículos
- Maquinaria
- Equipo de producción audiovisual

**Porcentajes anuales de depreciación** (principales):
- **Edificios**: 5% anual (20 años)
- **Mobiliario y equipo de oficina**: 10% anual (10 años)
- **Equipo de transporte**: 25% anual (4 años)
- **Equipo de cómputo**: 30% anual (3.33 años)
- **Maquinaria y equipo**: 10-12% anual (según tipo)
- **Cámaras, equipo de video**: 25% anual (4 años)

**Mecánica de deducción**:[1]

1. El porcentaje se aplica sobre el **monto original de inversión** (MOI), no sobre el saldo pendiente
2. La deducción inicia en el mes que empieces a usar el activo (o el mes siguiente)
3. El primer y último año se prorratea por meses de uso
4. No importa si pagaste a plazos, el MOI es el total del activo

**Ejemplo completo**:
- Compras equipo de cómputo el 15 de marzo 2025 por $30,000
- Porcentaje anual: 30%
- Deducción anual: $30,000 × 30% = $9,000
- Deducción 2025 (10 meses): $9,000 × 10/12 = $7,500
- Deducción 2026, 2027, 2028 (años completos): $9,000 cada año
- Deducción 2029 (2 meses): $9,000 × 2/12 = $1,500
- Total deducido: $30,000 (recuperas el 100% en 3.33 años)

**Consideración crítica para el sistema**:
- Debe existir un módulo de "Activos Fijos"
- Cada activo tiene: MOI, fecha de inicio de uso, porcentaje de depreciación, meses transcurridos
- El sistema debe calcular automáticamente la depreciación mensual y acumularla para pagos provisionales

## IV. Reglas de Cálculo de Pagos Provisionales (Art. 106 LISR)

### Regla 7: Sistema de Acumulación Progresiva Mensual

**Regla fundamental**: Los pagos provisionales NO son cálculos independientes cada mes. Son cálculos ACUMULADOS desde enero hasta el mes actual.[7][1]

**Fórmula oficial del Art. 106 LISR**:[1]

$$
\text{Base Gravable Acumulada} = \sum_{i=1}^{n} \text{Ingresos}_i - \sum_{i=1}^{n} \text{Deducciones}_i - \text{PTU Pagada} - \text{Pérdidas Fiscales Anteriores}
$$

Donde $$n$$ es el mes del pago provisional (1=enero, 2=febrero, ..., 12=diciembre).

**Pasos del cálculo**:[7][1]

#### Paso 1: Sumar Ingresos Acumulados

Suma TODOS los ingresos efectivamente percibidos desde el 1 de enero hasta el último día del mes que declaras.

**Regla de fechas**: Se usa la fecha de cobro efectivo, no la fecha de factura.

**Ejemplo**:
- Enero: cobros de $50,000
- Febrero: cobros de $45,000
- Marzo: cobros de $60,000
- **Ingresos acumulados a marzo**: $155,000

#### Paso 2: Sumar Deducciones Autorizadas Acumuladas

Suma TODAS las deducciones efectivamente erogadas desde el 1 de enero hasta el último día del mes que declaras.

**Incluye**:
- Gastos efectivamente pagados (fecha de pago)
- Depreciación de activos fijos acumulada (suma de todos los meses)
- Compras de inventario efectivamente pagadas

**No incluye en pagos provisionales**:
- Deducciones personales (médicos, educación, etc.) - solo en declaración anual

**Ejemplo**:
- Enero: gastos de $20,000 + depreciación $2,000 = $22,000
- Febrero: gastos de $18,000 + depreciación $2,000 = $20,000
- Marzo: gastos de $25,000 + depreciación $2,000 = $27,000
- **Deducciones acumuladas a marzo**: $69,000

#### Paso 3: Restar PTU Pagada (si aplica)

Si en marzo pagaste Participación de Trabajadores en Utilidades correspondiente a 2024, restas ese monto.

**Regla**: Solo aplica si tienes empleados y generaste utilidades en el ejercicio anterior.

#### Paso 4: Restar Pérdidas Fiscales de Ejercicios Anteriores

Si en años previos (2019-2024) tuviste pérdidas fiscales pendientes de amortizar, puedes restarlas (actualizadas por inflación).

**Actualización de pérdida fiscal**:[1]

$$
\text{Pérdida Actualizada} = \text{Pérdida Original} \times \frac{\text{INPC (último mes 1a mitad ejercicio actual)}}{\text{INPC (primer mes 2a mitad ejercicio de la pérdida)}}
$$

**Plazo**: 10 años para amortizar.

#### Paso 5: Base Gravable Acumulada

$$
\text{Base Gravable} = \text{Ingresos Acumulados} - \text{Deducciones Acumuladas} - \text{PTU} - \text{Pérdidas}
$$

**Continuando ejemplo**:
- Ingresos acumulados marzo: $155,000
- Deducciones acumuladas marzo: $69,000
- PTU: $0 (no hay empleados)
- Pérdidas fiscales: $0 (supongamos)
- **Base gravable marzo**: $86,000

### Regla 8: Aplicación de Tarifa Progresiva Mensual (Art. 96 LISR)

**Regla crítica**: La tarifa de ISR NO es un porcentaje fijo. Es una tabla PROGRESIVA con 11 tramos.[8][9]

**Estructura de la tabla**:

Cada tramo tiene 4 elementos:
1. **Límite inferior**: Inicio del rango
2. **Límite superior**: Fin del rango
3. **Cuota fija**: ISR base del tramo
4. **% sobre excedente**: Porcentaje que se aplica a la cantidad que exceda el límite inferior

**Tabla ISR Mensual 2025**:[9][8]

| Tramo | Límite Inferior | Límite Superior | Cuota Fija | % Excedente |
|-------|----------------|-----------------|------------|-------------|
| 1 | $0.01 | $746.04 | $0.00 | 1.92% |
| 2 | $746.05 | $6,332.05 | $14.32 | 6.40% |
| 3 | $6,332.06 | $11,128.01 | $371.83 | 10.88% |
| 4 | $11,128.02 | $12,935.82 | $893.63 | 16.00% |
| 5 | $12,935.83 | $15,487.71 | $1,182.88 | 17.92% |
| 6 | $15,487.72 | $31,236.49 | $1,640.18 | 21.36% |
| 7 | $31,236.50 | $49,233.00 | $5,004.12 | 23.52% |
| 8 | $49,233.01 | $93,993.90 | $9,236.89 | 30.00% |
| 9 | $93,993.91 | $125,325.20 | $22,665.17 | 32.00% |
| 10 | $125,325.21 | $375,975.61 | $32,691.18 | 34.00% |
| 11 | $375,975.62 | En adelante | $117,912.32 | 35.00% |

**Mecánica de aplicación de la tarifa**:[10][8]

1. Identifica en qué tramo cae tu base gravable acumulada
2. Resta el límite inferior del tramo a tu base gravable
3. Multiplica el excedente por el % del tramo
4. Suma la cuota fija del tramo
5. El resultado es el ISR acumulado del periodo

**Fórmula**:

$$
\text{ISR Acumulado} = (\text{Base Gravable} - \text{Límite Inferior}) \times \frac{\text{% Excedente}}{100} + \text{Cuota Fija}
$$

**Ejemplo con base gravable de $86,000**:

- Base gravable: $86,000
- Cae en tramo 8 ($49,233.01 a $93,993.90)
- Límite inferior: $49,233.01
- Cuota fija: $9,236.89
- % Excedente: 30%

$$
\text{ISR} = (86,000 - 49,233.01) \times 0.30 + 9,236.89 = 36,766.99 \times 0.30 + 9,236.89 = 11,030.10 + 9,236.89 = 20,266.99
$$

**ISR acumulado a marzo**: $20,266.99

### Regla 9: Deducción de Pagos Anteriores

**Regla fundamental**: Del ISR acumulado calculado, SIEMPRE debes restar los pagos provisionales ya realizados en meses anteriores del mismo ejercicio.[7][1]

$$
\text{ISR del Mes} = \text{ISR Acumulado} - \sum_{i=1}^{n-1} \text{Pagos Provisionales}_i - \sum_{i=1}^{n} \text{Retenciones}_i
$$

**Continuando ejemplo**:
- ISR acumulado a marzo: $20,266.99
- Pago provisional enero: $7,500
- Pago provisional febrero: $6,200
- Retenciones: $0
- **ISR a pagar en marzo**: $20,266.99 - $7,500 - $6,200 = $6,566.99

### Regla 10: Efecto de Cambio de Tramo Mensual

**Concepto crítico**: Como los ingresos se van acumulando mes a mes, tu base gravable crece, lo que te hace "subir" de tramo en la tabla.[8][7]

**Implicación**: Tu tasa efectiva de ISR aumenta progresivamente durante el año.

**Ejemplo ilustrativo**:

**Enero**:
- Base gravable acumulada: $30,000
- Tramo: 7 (21.36%)
- ISR: $4,740

**Abril**:
- Base gravable acumulada: $120,000
- Tramo: 9 (32%)
- ISR acumulado: $22,345
- Menos pagos anteriores: -$15,680
- ISR abril: $6,665

**Diciembre**:
- Base gravable acumulada: $380,000
- Tramo: 11 (35%)
- ISR acumulado: $119,323
- Menos pagos anteriores: -$102,890
- ISR diciembre: $16,433

**Observa**: Aunque tuviste ingresos similares cada mes, el ISR del mes va aumentando porque el porcentaje marginal crece.

### Regla 11: Retenciones de ISR por Servicios Profesionales

**Si prestas servicios a personas morales** (empresas), ellas deben retenerte el 10% como pago provisional.[1]

**Mecánica**:
- Cliente te paga $10,000 por servicios
- Retiene $1,000 (10%)
- Te deposita $9,000
- Te da CFDI de retención por $1,000
- Tú acumulas ingreso de $10,000
- En tu pago provisional, acreditas los $1,000 retenidos

**Consideración para el sistema**: Debe existir un módulo de "Retenciones Recibidas" que se acumulen y resten automáticamente del ISR a pagar.

## V. Reglas de Declaración Anual (Art. 109, 152 LISR)

### Regla 12: Cálculo del ISR Anual

**Plazo**: 1 de enero al 30 de abril del año siguiente.[1]

**Diferencias vs pagos provisionales**:

1. **Deducciones personales**: SÍ se pueden restar (médicos, colegiaturas, seguros, donativos, etc.)
2. **Tarifa anual**: Se usa la tabla del Art. 152 (anualizada), no la mensual
3. **Acreditamiento**: Se restan TODOS los pagos provisionales del año
4. **Resultado**: A pagar o a favor

**Límite de deducciones personales 2025**:[11]
- 15% de ingresos anuales, o
- 5 veces UMA anual ($206,367.60)
- **Lo que sea menor**

### Regla 13: Pérdidas Fiscales en Declaración Anual

**Si Deducciones > Ingresos del ejercicio**: Tienes pérdida fiscal.[1]

**Mecánica**:[1]
1. La pérdida se actualiza por inflación
2. Puede amortizarse en los siguientes 10 años
3. Se resta de utilidades futuras
4. Se actualiza cada vez que se aplica
5. Debe registrarse en cada declaración anual

**Consideración para el sistema**: Módulo de "Pérdidas Fiscales Pendientes" con:
- Año de origen
- Monto original
- Factores de actualización aplicados
- Saldo pendiente de amortizar
- Año de prescripción (10 años)

## VI. Reglas de IVA (Independientes de ISR)

### Regla 14: IVA Trasladado (Cobrado a Clientes)

**Tasa general**: 16% sobre el valor de tus servicios/productos.[6][12]

**Tasa 0%**: Exportación de servicios a extranjeros sin establecimiento en México.[13][14]

**Exento**: Algunos servicios específicos (educación, salud, renta de casa habitación).

### Regla 15: IVA Acreditable (Pagado a Proveedores)

**Regla de acreditamiento**: Solo puedes acreditar el IVA que cumpla TODOS estos requisitos:[12][15][6]

1. **Corresponda a deducciones autorizadas de ISR** (si no es deducible para ISR, tampoco acreditable para IVA)
2. **Esté desglosado en CFDI válido**
3. **Se use para actividades gravadas con IVA** (no exentas)
4. **Esté efectivamente pagado**
5. **Se registre contablemente en el mismo periodo**

**IVA no acreditable**:[6]
- IVA de gastos personales
- IVA de servicios exentos que consumas
- IVA cuando no tienes comprobante
- IVA de gastos no deducibles

### Regla 16: Cálculo de IVA Mensual

**Fórmula**:[6]

$$
\text{IVA a Pagar} = \text{IVA Trasladado (cobrado)} - \text{IVA Acreditable (pagado)}
$$

**Características**:
- Es cálculo MENSUAL independiente (no acumulado como ISR)
- Puedes tener saldo a favor que se arrastra al siguiente mes
- Plazo de pago: día 17 del mes siguiente

**Ejemplo**:
- Marzo: facturas por $100,000 + IVA $16,000 = $116,000
- Marzo: gastos deducibles $60,000 + IVA $9,600 = $69,600
- IVA a pagar marzo: $16,000 - $9,600 = $6,400

## VII. Reglas de Comprobantes Fiscales (CFDI)

### Regla 17: Requisitos del CFDI 4.0 (Vigente desde 2022)

**Campos obligatorios mínimos**:[16][4]

1. **RFC emisor**: Activo en padrón SAT
2. **RFC receptor**: Válido (o genéricos XAXX010101000, XEXX010101000)
3. **Régimen fiscal**: Del emisor y receptor
4. **Uso de CFDI**: Para qué usará el receptor la factura
5. **Forma de pago**: Efectivo, transferencia, cheque, etc.
6. **Método de pago**: PUE (pago en una exhibición) o PPD (pago en parcialidades)
7. **Moneda**: MXN, USD, EUR, etc.
8. **Tipo de cambio**: Si es moneda extranjera
9. **Conceptos**: Descripción detallada, clave de producto/servicio SAT, unidad de medida
10. **Impuestos**: IVA, retenciones (desglosados)
11. **UUID**: Folio fiscal único generado por PAC
12. **Sello digital**: Del emisor y del SAT
13. **Cadena original**: Para validación

### Regla 18: Facturación a Extranjeros

**RFC genérico para extranjeros**: XEXX010101000.[14][17]

**Campos especiales**:
- **Régimen fiscal receptor**: 616 (Sin obligaciones fiscales)
- **Uso de CFDI**: S01 (Sin efectos fiscales)
- **Domicilio fiscal**: Tu CP (72826), no del extranjero
- **Residencia fiscal**: País del cliente extranjero

**IVA en exportación de servicios**:[14]
- Tasa 0% si cumple requisitos (contrato con extranjero sin establecimiento en México, pago directo desde el extranjero)
- Se debe acreditar que el servicio se aprovecha en el extranjero

**Complemento de comercio exterior**: Obligatorio si exportas bienes físicos, opcional para servicios.[18]

### Regla 19: Factura Global (Público en General)

**RFC genérico nacional**: XAXX010101000.[17]

**Cuándo usarlo**:
- Ventas al público en general menores a $250 pesos (opcional facturar)
- Puedes emitir una factura global diaria, semanal o mensual

**No confundir**: 
- XAXX010101000 = público general nacional
- XEXX010101000 = público general extranjero
- No mezcles extranjeros en factura global nacional

## VIII. Reglas de Contabilidad Electrónica

### Regla 20: Obligación de Contabilidad Electrónica

**Obligados** (Art. 28 CFF):[19][20]
- Personas físicas con ingresos > $2,000,000 anuales
- Todos los que no usen "Mis Cuentas" del SAT

**No obligados**:[19]
- Ingresos < $2,000,000 y usan "Mis Cuentas"

**Archivos a enviar**:[20][19]

1. **Catálogo de cuentas**: Una vez y cada que se modifique
   - Formato XML
   - Con código agrupador del SAT (Anexo 24)
   - Estructura jerárquica de tu contabilidad

2. **Balanza de comprobación**: Mensual
   - Personas físicas: día 7 del segundo mes siguiente
   - Ejemplo: balanza de octubre 2025 se envía el 7 de diciembre 2025
   - Formato XML
   - Saldos iniciales, cargos, abonos, saldos finales de cada cuenta

3. **Pólizas y auxiliares**: Solo cuando el SAT los solicite
   - En auditorías
   - Solicitudes de devolución
   - Revisiones electrónicas

### Regla 21: Código Agrupador del SAT

**Obligación**: Cada cuenta contable debe asociarse a un código del catálogo del SAT.[20]

**Ejemplo**:
- Cuenta contable: "Bancos BBVA"
- Código SAT: 102.01 (Bancos nacionales)

**Códigos principales**:
- 100: Activo
- 200: Pasivo
- 300: Capital contable
- 400: Ingresos
- 500: Costos
- 600: Gastos de operación
- 700: Gastos y productos financieros
- 800: Otros ingresos y gastos

## IX. Reglas de Corrección: Declaraciones Complementarias

### Regla 22: Tipos de Declaraciones Complementarias (Art. 32 CFF)

**Declaración complementaria**: Permite corregir declaraciones ya presentadas.[21][22]

**Límite**: 3 veces por declaración, salvo excepciones.[21]

**Excepciones (sin límite de veces)**:[22][21]
1. Cuando **solo incrementes ingresos**
2. Cuando **solo disminuyas deducciones**
3. Cuando **solo reduzcas acreditamientos o compensaciones**
4. Cuando la ley te obligue expresamente a presentarla

**Tipos**:[21]

1. **Complementaria Normal**: Cuando NO presentaste la declaración original (extemporánea)
2. **Complementaria de Modificación**: Cuando corriges errores de una declaración ya presentada
3. **Complementaria de Corrección Fiscal**: Cuando el SAT ya te notificó de una revisión

### Regla 23: Efectos Retroactivos de Declaraciones Complementarias

**Regla fundamental**: Una declaración complementaria **REEMPLAZA completamente** la declaración original.[22][21]

**Implicaciones**:
- Si corriges un mes de pagos provisionales, los meses posteriores del mismo ejercicio se ven afectados
- La complementaria debe presentarse con los datos CORRECTOS completos, no solo el error

**Mecánica de corrección retroactiva**:

**Escenario**: En octubre 2025 descubres que en mayo 2025 olvidaste registrar $20,000 de ingresos.

**Proceso**:
1. Presentas complementaria de **mayo** con los $20,000 adicionales
2. Pagas ISR e IVA adicional de mayo (con recargos y actualizaciones)
3. **OPCIONAL pero recomendado**: Presentas complementarias de **junio a septiembre** porque la base acumulada cambió
4. El SAT puede requerir que corrijas todo el ejercicio

**Consideración para el sistema**: Un módulo de "Simulación de Complementarias" que:
- Identifique el mes del error
- Recalcule ese mes y todos los posteriores
- Muestre el ISR adicional (o a favor) de cada mes
- Calcule recargos y actualizaciones
- Genere las declaraciones complementarias pre-llenadas

### Regla 24: Recargos y Actualizaciones en Complementarias

**Si la complementaria resulta en ISR adicional a pagar**:[21]

1. **Actualización**: El saldo se actualiza por inflación desde la fecha de pago original hasta la fecha de pago real
   - Factor = INPC mes de pago / INPC mes que debió pagarse

2. **Recargos**: Tasa de recargos mensual (aprox. 1.13% mensual en 2025) desde fecha de vencimiento original

**Fórmula**:

$$
\text{Total a Pagar} = \text{ISR Original} \times \text{Factor Actualización} + \text{Recargos}
$$

**Consideración para el sistema**: Debe calcular automáticamente actualizaciones y recargos cuando se genere una complementaria con saldo a cargo.

## X. Reglas de Registro Contable

### Regla 25: Gastos No Deducibles en Contabilidad

**Regla contable vs fiscal**: Un gasto puede ser contable (se registra) pero no fiscal (no se deduce).[23][24][25]

**Registro correcto**:[24][26]

1. **En contabilidad**: Se registra como gasto normal por su naturaleza
   - Ejemplo: Multa de tránsito → Gasto por multas

2. **En control fiscal**: Se marca como "no deducible"

3. **En papeles de trabajo**: Se suma en conciliación contable-fiscal

4. **Alternativa**: Usar "cuentas de orden" para segregar gastos no deducibles

**Ejemplo**:
- Compras gasolina con ticket (sin CFDI) por $500
- Registro contable: Cargo a "Combustibles" $500
- Control fiscal: Campo "deducible_ISR" = FALSE
- Efecto: No se resta en el cálculo de pagos provisionales

### Regla 26: Gastos Mixtos (Uso Personal y Empresarial)

**Regla**: Solo es deducible la proporción empresarial.[27][5]

**Casos típicos**:

**Auto propio usado para negocio**:[5]
- Deducible si valor < $175,000 (o $250,000 híbrido/eléctrico)
- Si cuesta más, solo proporción: $175,000 / precio total
- Gasolina: proporción km empresariales / km totales

**Casa habitación con oficina**:[27]
- Deducible: proporción m² de oficina / m² totales
- Aplica a: renta, luz, internet, mantenimiento, predial
- Requisito: demostrar uso exclusivo del espacio como oficina

**Teléfono celular**:
- Proporción de uso empresarial (difícil de probar)
- Mejor: línea exclusiva para negocio

**Consideración para el sistema**: Campo de "% Deducible" en cada transacción, que multiplique automáticamente el monto al calcular deducciones.

## XI. Reglas de Plazos y Vigencias

### Regla 27: Calendario Fiscal Mensual

**Día 17 de cada mes** (o siguiente hábil):[28][29]
- Pago provisional ISR
- Pago definitivo IVA
- Retenciones de ISR a terceros (si aplica)
- Cuotas IMSS e INFONAVIT (si aplica)

**Último día del mes** (o siguiente hábil):[29]
- DIOT (Declaración Informativa de Operaciones con Terceros)

**Día 7 del segundo mes siguiente** (si aplica contabilidad electrónica):[19]
- Envío de balanza de comprobación

**30 de abril**:[28]
- Declaración anual del ejercicio anterior

### Regla 28: Vigencia de CFDI y Cancelaciones

**Plazo de cancelación**:[21]
- CFDI versión 4.0: 30 días naturales desde emisión
- Después de 30 días: requiere aceptación del receptor

**Validación de CFDI**:[4]
- Todos los CFDI deben validarse contra el servicio del SAT
- Status posibles: Vigente, Cancelado, No encontrado
- Solo los "Vigentes" son válidos para deducción

**Conservación**:[1]
- Mínimo 5 años posteriores a la presentación de la declaración
- Formato: XML + PDF
- El SAT puede solicitar documentación de hasta 5 años atrás

## XII. Implementación: Estructura de Datos Necesaria

### Entidades del Sistema

Para implementar correctamente todas las reglas anteriores, el sistema debe tener estas entidades de datos:

**1. Transacciones**
- ID único
- Fecha de documento
- Fecha de pago efectivo (crítico para acumulación)
- Tipo (ingreso/egreso)
- Concepto
- Monto sin IVA
- IVA trasladado/acreditable
- Monto total
- RFC contraparte
- CFDI UUID
- Status CFDI (vigente/cancelado)
- Deducible ISR (sí/no)
- IVA acreditable (sí/no)
- Porcentaje deducible (0-100%, para gastos mixtos)
- Categoría contable
- Código agrupador SAT
- Mes fiscal de acumulación
- Ejercicio fiscal

**2. Activos Fijos**
- ID único
- Descripción
- Fecha de adquisición
- Fecha inicio de uso
- Monto original de inversión
- Tipo de activo
- Porcentaje de depreciación anual
- Depreciación acumulada
- Valor pendiente de deducir
- Status (activo/vendido/dado de baja)

**3. Tablas ISR**
- Ejercicio fiscal
- Periodo (mensual/anual)
- Tramo número
- Límite inferior
- Límite superior
- Cuota fija
- Porcentaje sobre excedente
- Fecha vigencia inicio
- Fecha vigencia fin

**4. Pagos Provisionales**
- Mes
- Año
- Ingresos acumulados
- Deducciones acumuladas
- Base gravable
- ISR acumulado
- Pagos anteriores
- Retenciones
- ISR a pagar/favor
- Fecha de pago
- Folio de declaración SAT
- Status (calculado/pagado/complementado)

**5. Declaración Anual**
- Ejercicio
- Ingresos totales
- Deducciones autorizadas
- Deducciones personales
- Utilidad fiscal
- Pérdida fiscal
- ISR del ejercicio
- Pagos provisionales
- Retenciones
- ISR a pagar/favor
- Fecha presentación
- Folio SAT

**6. Pérdidas Fiscales**
- Ejercicio de origen
- Monto original
- Monto actualizado
- Monto aplicado acumulado
- Saldo pendiente
- Año de prescripción

**7. Retenciones Recibidas**
- Fecha
- RFC retenedor
- Monto retenido
- CFDI de retención UUID
- Mes aplicable
- Acreditado en declaración (sí/no)

**8. Catálogo de Cuentas**
- Código cuenta
- Nombre cuenta
- Nivel jerárquico
- Código agrupador SAT
- Naturaleza (deudora/acreedora)
- Tipo (detalle/acumulativa)

**9. Pólizas Contables**
- Número de póliza
- Fecha
- Tipo (ingreso/egreso/diario)
- Referencia
- Concepto
- Movimientos (subcuentas):
  - Código cuenta
  - Cargo
  - Abono
  - UUID CFDI (si aplica)

**10. Balanzas de Comprobación**
- Mes
- Año
- Código cuenta
- Saldo inicial
- Cargos del periodo
- Abonos del periodo
- Saldo final
- Fecha de envío SAT
- Status (pendiente/enviada/aceptada)

### Flujos de Cálculo

**Flujo 1: Registro de Ingreso**
1. Captura fecha factura y fecha cobro
2. Valida CFDI contra SAT
3. Extrae RFC cliente, monto, IVA
4. Determina mes fiscal por fecha de cobro
5. Acumula en ingresos del mes fiscal
6. Registra IVA trasladado
7. Actualiza acumulados del ejercicio
8. Recalcula pagos provisionales pendientes

**Flujo 2: Registro de Egreso**
1. Captura fecha factura y fecha pago
2. Valida CFDI contra SAT
3. Valida requisitos de deducibilidad (indispensable, pago efectuado, etc.)
4. Marca deducible ISR (sí/no)
5. Marca IVA acreditable (sí/no)
6. Aplica % deducible si es gasto mixto
7. Si es activo fijo, crea registro de depreciación
8. Determina mes fiscal por fecha de pago
9. Acumula en deducciones del mes fiscal
10. Actualiza acumulados del ejercicio
11. Recalcula pagos provisionales pendientes

**Flujo 3: Cálculo de Pago Provisional**
1. Suma ingresos acumulados (enero a mes actual)
2. Suma deducciones acumuladas (enero a mes actual)
3. Suma depreciación acumulada (enero a mes actual)
4. Resta PTU si aplica
5. Resta pérdidas fiscales actualizadas
6. Obtiene base gravable
7. Identifica tramo en tabla ISR
8. Aplica fórmula de tarifa progresiva
9. Obtiene ISR acumulado
10. Resta pagos provisionales anteriores
11. Resta retenciones acumuladas
12. Determina ISR del mes (a pagar o a favor)
13. Calcula IVA del mes (trasladado - acreditable)
14. Genera pre-declaración

**Flujo 4: Recalculación Retroactiva**
1. Identifica mes de cambio
2. Para cada mes desde el cambio hasta mes actual:
   a. Recalcula ingresos acumulados
   b. Recalcula deducciones acumuladas
   c. Recalcula base gravable
   d. Recalcula ISR acumulado
   e. Resta pagos anteriores actualizados
   f. Determina diferencia vs declarado
3. Genera reporte de discrepancias
4. Calcula actualizaciones y recargos si hay adeudos
5. Genera declaraciones complementarias sugeridas

**Flujo 5: Declaración Anual**
1. Suma ingresos del ejercicio completo
2. Suma deducciones autorizadas del ejercicio
3. Captura deducciones personales
4. Valida límite 15% o 5 UMAs
5. Calcula utilidad/pérdida fiscal
6. Aplica tarifa anual Art. 152
7. Resta pagos provisionales del año
8. Resta retenciones del año
9. Determina ISR anual (a pagar o a favor)
10. Si hay pérdida, registra para 10 años
11. Genera declaración anual
12. Actualiza saldos para siguiente ejercicio

## XIII. Validaciones Críticas del Sistema

El sistema debe validar automáticamente:

1. **CFDI vigente**: Consultar status en SAT antes de aceptar deducción
2. **RFC correcto**: El CFDI debe estar a nombre de REGM000905T24
3. **Congruencia de fechas**: Fecha de emisión ≤ fecha de pago ≤ fecha de registro
4. **Límite de efectivo**: Alertar si pago > $2,000 en efectivo (no deducible)
5. **Cheque antiguo**: Si cheque > 4 meses entre emisión y cobro (no deducible)
6. **Deducción sin pago**: Alertar si se deduce algo no pagado (salvo activos fijos)
7. **IVA sin ISR**: Si marca IVA acreditable pero no deducible ISR (inconsistencia)
8. **Proporción > 100%**: Si % deducible > 100% (error)
9. **Depreciación acelerada**: Si depreciación mensual > MOI × %anual / 12
10. **Pérdida fiscal prescrita**: Si pérdida > 10 años (ya no aplica)
11. **Tabla ISR desactualizada**: Alertar si se usa tabla de año anterior
12. **Declaración fuera de plazo**: Calcular recargos automáticamente

Esta especificación completa te permite entender todas las reglas fiscales del SAT y proporciona la base técnica para que cualquier desarrollador o agente de IA implemente un sistema de contabilidad fiscal robusto, preciso y retroactivo.[3][9][8][7][2][21][1]

[1](https://mexico.justia.com/federales/leyes/ley-del-impuesto-sobre-la-renta/titulo-iv/capitulo-ii/seccion-i/)
[2](https://beconsultores.com/ingresos-por-actividades-empresariales-y-profesionales/)
[3](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/16922147/3070a3dc-23d4-4463-9856-27f304f44a4d/csf.pdf)
[4](https://www.dof.gob.mx/avisos/2094/SHCP_121211_03/SHCP_121211_03.htm)
[5](https://www.pluxee.mx/blog/gastos-deducibles-para-personas-fisicas-y-empresas-en-2025/)
[6](https://blog.sivale.mx/deducibilidad-de-la-empresa/que-es-el-iva-acreditable-en-una-empresa)
[7](https://facturoporti.com.mx/pagos-provisionales-de-personas-morales/)
[8](https://www.siigo.com/mx/blog/obligaciones-fiscales/tablas-isr-tarifa-base-impuesto-sobre-renta/)
[9](https://facturama.mx/blog/tablas-isr/)
[10](https://facturama.mx/blog/como-calcular-el-isr/)
[11](https://taxdown.com.mx/deducciones/limite-deducciones-personales)
[12](https://pulpos.com/blog/iva-acreditable-en-mexico)
[13](https://kpmg.com/mx/es/tendencias/2024/02/ao-exportacion-de-servicios-sujeta-a-la-tasa-0-de-iva.html)
[14](https://www.cfdis.mx/blog/facturacion-a-clientes-extranjeros-lo-que-hay-que-saber)
[15](http://omawww.sat.gob.mx/informacion_fiscal/obligaciones_fiscales/personas_morales/regimen_simplificado/Paginas/requisitos_acreditar_iva.aspx)
[16](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/Anexo_20_Guia_de_llenado_CFDI.pdf)
[17](https://siemprealdia.co/mexico/fiscal/implicaciones-del-rfc-generico-en-operaciones-de-exportacion/)
[18](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/Guia_complemento_Comercio_Exterior.pdf)
[19](https://cofers.mx/blog/contabilidad-electronica-sat/)
[20](https://suempresa.com/blog/tu-contabilidad-en-la-nube-cumple-con-los-requisitos-del-sat)
[21](https://facturama.mx/blog/que-significa/declaracion-complementaria/)
[22](https://taxdown.com.mx/declaracion-anual/como-hacer-declaracion-complementaria)
[23](https://www.siigo.com/mx/blog/contabilidad-y-finanzas/guia-gastos-no-deducibles-personas-fisicas-y-morales/)
[24](https://elconta.mx/no-deducibles-correcto-registro-cuentas-de-orden/)
[25](https://www.acpm.mx/post/impacto-fiscal-de-los-gastos-no-deducibles)
[26](https://vlex.com.mx/vid/registro-contable-partidas-no-645433905)
[27](https://buencontador.com/deducir-casa-habitacion-2025/)
[28](https://www.altonivel.com.mx/cuales-son-las-obligaciones-fiscales-en-2025/)
[29](https://www.grupoaltea.org/post/cu%C3%A1l-es-el-calendario-de-obligaciones-fiscales-de-octubre-2025-para-contribuyentes-en-m%C3%A9xico)
[30](https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf)
[31](https://mexico.justia.com/federales/leyes/ley-del-impuesto-sobre-la-renta/titulo-iv/capitulo-ii/)
[32](https://wwwmat.sat.gob.mx/ordenamiento/18355/ley-del-impuesto-sobre-la-renta)
[33](https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf)
[34](http://omawww.sat.gob.mx/fichas_tematicas/pago_referenciado/Paginas/correccion_errores_declaraciones.aspx)
[35](https://sil.gobernacion.gob.mx/Archivos/Documentos/2001/04/asun_991_20010405_777179.pdf)
[36](https://mexico.justia.com/federales/codigos/codigo-fiscal-de-la-federacion/titulo-segundo/capitulo-unico/)
[37](https://www.oas.org/juridico/spanish/mesicic3_mex_anexo13.pdf)
[38](http://omawww.sat.gob.mx/fichas_tematicas/pago_referenciado/Paginas/procedimiento_para_declaraciones.aspx)
[39](https://wwwmat.sat.gob.mx/cs/Satellite?blobcol=urldata&blobkey=id&blobtable=MungoBlobs&blobwhere=1461172400917&ssbinary=true)
[40](http://www.apta.com.mx/aptace/leyes/ley.php?ley=LISR)
[41](https://www.ppef.hacienda.gob.mx/work/models/PP3F2609/PPEF2026/Fiw326fP/paquete/ingresos/CFF_2026.pdf)
[42](https://www.youtube.com/watch?v=t5emiMGs5A0)
[43](http://omawww.sat.gob.mx/fichas_tematicas/buzon_tributario/Paginas/arts_33_34-rcff.aspx)