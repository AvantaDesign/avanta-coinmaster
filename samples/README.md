# Archivos de Ejemplo / Sample Files

Este directorio contiene archivos de ejemplo para probar la funcionalidad de importación de CSV y CFDI XML.

## 📄 Archivos CSV de Bancos

### `bbva-sample.csv`
Archivo de ejemplo en formato BBVA con 10 transacciones.

**Formato:**
- Fecha, Descripción, Cargo, Abono, Saldo

**Contenido:**
- Compras (Cargo): OXXO, Super Soriana, Papelería, etc.
- Depósitos (Abono): Nómina, Cliente Avanta, Transferencias
- Pagos de servicios: Luz CFE, Internet Totalplay, Spotify

### `azteca-sample.csv`
Archivo de ejemplo en formato Banco Azteca con 10 transacciones.

**Formato:**
- Fecha, Concepto, Retiro, Depósito, Saldo

**Contenido:**
- Retiros: Farmacia, Gas Natural, Gasolina PEMEX, Equipo fotografía
- Depósitos: Efectivo, Pago factura video
- Servicios: Comisión anual, Suscripción Adobe

## 📋 Archivos CFDI XML

### `cfdi-ingreso-sample.xml`
Factura de ingreso (emitida) - Ejemplo de videoclip comercial.

**Datos:**
- UUID: 12345678-1234-1234-1234-123456789012
- Serie/Folio: A/12345
- Emisor: EMPRESA EJEMPLO SA DE CV
- Receptor: REYES GONZALEZ MATEO (REGM000905T24)
- Concepto: Producción de videoclip comercial
- Subtotal: $12,068.97 MXN
- IVA (16%): $1,931.03 MXN
- Total: $14,000.00 MXN

### `cfdi-gasto-sample.xml`
Factura de gasto (recibida) - Ejemplo de servicios de hosting.

**Datos:**
- UUID: 98765432-9876-9876-9876-987654321098
- Serie/Folio: B/98765
- Emisor: PROVEEDOR DE SERVICIOS SA
- Receptor: REYES GONZALEZ MATEO (REGM000905T24)
- Conceptos: Hosting web + Mantenimiento sitio
- Subtotal: $3,448.28 MXN
- IVA (16%): $551.72 MXN
- Total: $4,000.00 MXN

## 🧪 Cómo Usar los Archivos de Ejemplo

### Importar CSV:
1. Ir a la página **Transacciones**
2. Hacer clic en **📥 Importar CSV**
3. Arrastrar o seleccionar `bbva-sample.csv` o `azteca-sample.csv`
4. Elegir tipo de banco (o dejar en "Detectar Automáticamente")
5. Hacer clic en **Analizar CSV**
6. Revisar y editar las transacciones si es necesario
7. Hacer clic en **Importar X Transacciones**

### Importar CFDI:
1. Ir a la página **Facturas CFDI**
2. Hacer clic en **📥 Importar XML**
3. Arrastrar o seleccionar `cfdi-ingreso-sample.xml` o `cfdi-gasto-sample.xml`
4. Hacer clic en **Analizar CFDI**
5. Revisar los datos extraídos del XML
6. Opcionalmente, marcar "Crear también una transacción"
7. Hacer clic en **Importar CFDI**

## ✅ Validaciones

Todos los archivos están validados y cumplen con:

### CSV:
- ✅ Formato correcto (Fecha, Descripción, Montos, Saldo)
- ✅ Fechas válidas en formato DD/MM/YYYY
- ✅ Montos numéricos con formato mexicano
- ✅ Balance correcto entre transacciones

### CFDI XML:
- ✅ Estructura XML válida según estándar SAT
- ✅ UUID único de 36 caracteres
- ✅ RFC válidos para emisor y receptor
- ✅ Cálculos de IVA al 16% correctos
- ✅ Timbre Fiscal Digital incluido
- ✅ Compatible con CFDI 3.3

## 📊 Estadísticas de Ejemplo

### BBVA Sample:
- Total transacciones: 10
- Ingresos: 4 (Total: $26,000.00)
- Gastos: 6 (Total: $5,429.25)
- Saldo final: $22,849.75

### Azteca Sample:
- Total transacciones: 10
- Ingresos: 3 (Total: $20,500.00)
- Gastos: 7 (Total: $6,454.50)
- Saldo final: $22,546.50

### CFDI Samples:
- Total facturas: 2
- Ingresos (emitidas): 1 ($14,000.00)
- Gastos (recibidas): 1 ($4,000.00)
- IVA total: $2,482.75

## 🔧 Notas Técnicas

### Formatos Soportados:

**CSV:**
- Codificación: UTF-8
- Separador: Coma (,)
- Formato de fechas: DD/MM/YYYY
- Formato de montos: Con o sin símbolos ($), con comas para miles

**XML:**
- Codificación: UTF-8
- Versiones CFDI: 3.3 y 4.0
- Namespace: http://www.sat.gob.mx/cfd/3

### Parsers Implementados:

1. **csvParser.js**: 
   - parseCSV() - Parser genérico de CSV
   - parseBBVAStatement() - Parser específico BBVA
   - parseAztecaStatement() - Parser específico Azteca
   - parseGenericBankStatement() - Auto-detección de formato
   - exportToCSV() - Exportación a CSV
   - validateTransactions() - Validación de datos

2. **cfdiParser.js**:
   - parseCFDI() - Parser completo de CFDI XML
   - validateCFDI() - Validación de estructura y datos
   - cfdiToInvoice() - Conversión a formato de factura
   - cfdiToTransaction() - Conversión a transacción
   - formatCFDIDisplay() - Formato para visualización

## 📝 Crear Tus Propios Archivos

### CSV personalizado:

```csv
Fecha,Descripción,Cargo,Abono,Saldo
15/01/2025,Mi Transacción,100.00,,9900.00
```

O formato Azteca:
```csv
Fecha,Concepto,Retiro,Depósito,Saldo
15/01/2025,Mi Transacción,100.00,,9900.00
```

### CFDI personalizado:
Usa los archivos de ejemplo como plantilla y modifica:
- UUID (debe ser único)
- Fechas
- RFCs
- Montos
- Conceptos

## 🆘 Solución de Problemas

**Error: "CSV file is empty"**
- Verifica que el archivo tenga contenido
- Asegúrate de que use codificación UTF-8

**Error: "UUID inválido"**
- El UUID debe tener exactamente 36 caracteres
- Formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

**Error: "RFC tiene formato inválido"**
- RFC debe ser 12 o 13 caracteres
- Formato: XXXNNNNNNXXX (X=letra, N=número)

## 🎯 Próximos Pasos

Después de importar los archivos de ejemplo:
1. Revisar las transacciones importadas en la página **Transacciones**
2. Clasificar gastos como deducibles si aplica
3. Asignar actividades económicas
4. Revisar las facturas en la página **Facturas CFDI**
5. Verificar cálculos fiscales en la página **Fiscal**
6. Exportar tus transacciones a CSV usando el botón **📤 Exportar CSV**

---

Built with ❤️ for Mateo Reyes González / Avanta Design
