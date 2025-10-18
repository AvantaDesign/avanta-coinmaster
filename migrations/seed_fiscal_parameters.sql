-- Seed Fiscal Parameters
-- Purpose: Initialize fiscal parameters for 2023-2025
-- Date: October 2025

-- ISR Brackets for 2024-2025 (same structure)
-- These are the monthly ISR brackets for "Persona Física con Actividad Empresarial"
INSERT OR IGNORE INTO fiscal_parameters (id, parameter_type, period_type, effective_from, effective_to, value, description, source, is_active)
VALUES 
('isr_brackets_2024', 'isr_bracket', 'annual', '2024-01-01', '2024-12-31', 
'[
  {"min": 0, "max": 7735.00, "rate": 0.0192, "fixedFee": 0, "lowerLimit": 0},
  {"min": 7735.01, "max": 65651.07, "rate": 0.0640, "fixedFee": 148.51, "lowerLimit": 7735.00},
  {"min": 65651.08, "max": 115375.90, "rate": 0.1088, "fixedFee": 3855.14, "lowerLimit": 65651.07},
  {"min": 115375.91, "max": 134119.41, "rate": 0.1600, "fixedFee": 9265.20, "lowerLimit": 115375.90},
  {"min": 134119.42, "max": 160577.65, "rate": 0.1792, "fixedFee": 12264.16, "lowerLimit": 134119.41},
  {"min": 160577.66, "max": 323862.00, "rate": 0.2136, "fixedFee": 17005.47, "lowerLimit": 160577.65},
  {"min": 323862.01, "max": 510451.00, "rate": 0.2352, "fixedFee": 51883.01, "lowerLimit": 323862.00},
  {"min": 510451.01, "max": 974535.03, "rate": 0.3000, "fixedFee": 95768.74, "lowerLimit": 510451.00},
  {"min": 974535.04, "max": 1299380.04, "rate": 0.3200, "fixedFee": 234993.95, "lowerLimit": 974535.03},
  {"min": 1299380.05, "max": 3898140.12, "rate": 0.3400, "fixedFee": 338944.34, "lowerLimit": 1299380.04},
  {"min": 3898140.13, "max": null, "rate": 0.3500, "fixedFee": 1222522.76, "lowerLimit": 3898140.12}
]', 
'ISR monthly brackets for 2024', 'SAT', 1);

INSERT OR IGNORE INTO fiscal_parameters (id, parameter_type, period_type, effective_from, effective_to, value, description, source, is_active)
VALUES 
('isr_brackets_2025', 'isr_bracket', 'annual', '2025-01-01', NULL, 
'[
  {"min": 0, "max": 7735.00, "rate": 0.0192, "fixedFee": 0, "lowerLimit": 0},
  {"min": 7735.01, "max": 65651.07, "rate": 0.0640, "fixedFee": 148.51, "lowerLimit": 7735.00},
  {"min": 65651.08, "max": 115375.90, "rate": 0.1088, "fixedFee": 3855.14, "lowerLimit": 65651.07},
  {"min": 115375.91, "max": 134119.41, "rate": 0.1600, "fixedFee": 9265.20, "lowerLimit": 115375.90},
  {"min": 134119.42, "max": 160577.65, "rate": 0.1792, "fixedFee": 12264.16, "lowerLimit": 134119.41},
  {"min": 160577.66, "max": 323862.00, "rate": 0.2136, "fixedFee": 17005.47, "lowerLimit": 160577.65},
  {"min": 323862.01, "max": 510451.00, "rate": 0.2352, "fixedFee": 51883.01, "lowerLimit": 323862.00},
  {"min": 510451.01, "max": 974535.03, "rate": 0.3000, "fixedFee": 95768.74, "lowerLimit": 510451.00},
  {"min": 974535.04, "max": 1299380.04, "rate": 0.3200, "fixedFee": 234993.95, "lowerLimit": 974535.03},
  {"min": 1299380.05, "max": 3898140.12, "rate": 0.3400, "fixedFee": 338944.34, "lowerLimit": 1299380.04},
  {"min": 3898140.13, "max": null, "rate": 0.3500, "fixedFee": 1222522.76, "lowerLimit": 3898140.12}
]', 
'ISR monthly brackets for 2025', 'SAT', 1);

-- IVA Rate (16% - standard rate in Mexico)
INSERT OR IGNORE INTO fiscal_parameters (id, parameter_type, period_type, effective_from, effective_to, value, description, source, is_active)
VALUES 
('iva_rate_2024', 'iva_rate', 'permanent', '2024-01-01', NULL, '0.16', 'IVA standard rate 16%', 'SAT', 1);

-- IVA Retention Rate (10.67% - for professional services)
INSERT OR IGNORE INTO fiscal_parameters (id, parameter_type, period_type, effective_from, effective_to, value, description, source, is_active)
VALUES 
('iva_retention_2024', 'iva_retention', 'permanent', '2024-01-01', NULL, '0.1067', 'IVA retention rate for professional services', 'SAT', 1);

-- DIOT Threshold (50,000 MXN monthly)
INSERT OR IGNORE INTO fiscal_parameters (id, parameter_type, period_type, effective_from, effective_to, value, description, source, is_active)
VALUES 
('diot_threshold_2024', 'diot_threshold', 'permanent', '2024-01-01', NULL, '50000', 'DIOT filing threshold', 'SAT', 1);

-- UMA Values (Unidad de Medida y Actualización)
INSERT OR IGNORE INTO fiscal_parameters (id, parameter_type, period_type, effective_from, effective_to, value, description, source, is_active)
VALUES 
('uma_2024', 'uma_value', 'annual', '2024-01-01', '2024-12-31', '108.57', 'UMA daily value for 2024', 'INEGI', 1),
('uma_2025', 'uma_value', 'annual', '2025-01-01', NULL, '113.14', 'UMA daily value for 2025 (estimated)', 'INEGI', 1);

-- Minimum Wage
INSERT OR IGNORE INTO fiscal_parameters (id, parameter_type, period_type, effective_from, effective_to, value, description, source, is_active)
VALUES 
('minimum_wage_2024', 'minimum_wage', 'annual', '2024-01-01', '2024-12-31', '248.93', 'Daily minimum wage for 2024', 'CONASAMI', 1),
('minimum_wage_2025', 'minimum_wage', 'annual', '2025-01-01', NULL, '278.80', 'Daily minimum wage for 2025 (estimated)', 'CONASAMI', 1);
