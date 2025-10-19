-- ============================================================================
-- Migration 032: Add Intelligent Compliance Rules Engine
-- Phase 28: Intelligent Compliance Engine
-- Description: Create tables and infrastructure for the automated compliance
--              rules engine that validates transactions against SAT requirements
-- ============================================================================

-- ============================================================================
-- PART 1: Create Compliance Rules Table
-- ============================================================================

-- Compliance rules table: Store configurable rules for fiscal compliance
CREATE TABLE IF NOT EXISTS compliance_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK(rule_type IN (
        'cfdi_requirement',
        'cash_limit',
        'iva_accreditation',
        'isr_deduction',
        'foreign_client',
        'vehicle_deduction',
        'payment_method',
        'expense_classification',
        'receipt_validation',
        'general_validation'
    )),
    description TEXT,
    -- Rule conditions as JSON: conditions to check for rule applicability
    -- Example: {"amount": {"operator": "gt", "value": 2000}, "payment_method": {"equals": "cash"}}
    rule_conditions TEXT NOT NULL,
    -- Rule actions as JSON: what to do when rule applies
    -- Example: {"set_is_deductible": false, "set_warning": "Pagos en efectivo mayores a $2,000 no son deducibles"}
    rule_actions TEXT NOT NULL,
    priority INTEGER DEFAULT 0, -- Higher priority rules execute first
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    severity TEXT DEFAULT 'warning' CHECK(severity IN ('info', 'warning', 'error', 'blocking')),
    applies_to TEXT DEFAULT 'all' CHECK(applies_to IN ('all', 'income', 'expense', 'transfer')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT -- System or user who created the rule
);

-- ============================================================================
-- PART 2: Create Rule Execution Log Table
-- ============================================================================

-- Rule execution log: Audit trail of rule applications
CREATE TABLE IF NOT EXISTS rule_execution_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    rule_id INTEGER,
    entity_type TEXT NOT NULL CHECK(entity_type IN ('transaction', 'cfdi', 'invoice', 'category')),
    entity_id INTEGER,
    -- Execution result as JSON: what the rule determined and any changes made
    -- Example: {"rule_applied": true, "changes": {"is_deductible": false}, "reason": "Cash payment exceeds $2,000"}
    execution_result TEXT NOT NULL,
    rule_matched INTEGER DEFAULT 0 CHECK(rule_matched IN (0, 1)), -- Did the rule conditions match?
    actions_applied INTEGER DEFAULT 0 CHECK(actions_applied IN (0, 1)), -- Were actions applied?
    executed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(rule_id) REFERENCES compliance_rules(id) ON DELETE SET NULL
);

-- ============================================================================
-- PART 3: Create Compliance Suggestions Table
-- ============================================================================

-- Compliance suggestions: Store suggestions for improving compliance
CREATE TABLE IF NOT EXISTS compliance_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    suggestion_type TEXT NOT NULL CHECK(suggestion_type IN (
        'missing_cfdi',
        'payment_method_issue',
        'amount_threshold',
        'deductibility_warning',
        'iva_warning',
        'documentation_needed',
        'general'
    )),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'info' CHECK(severity IN ('info', 'warning', 'error')),
    suggested_action TEXT, -- What the user should do
    is_resolved INTEGER DEFAULT 0 CHECK(is_resolved IN (0, 1)),
    resolved_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- PART 4: Create Indexes for Performance
-- ============================================================================

-- Compliance rules indexes
CREATE INDEX IF NOT EXISTS idx_compliance_rules_type ON compliance_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_active ON compliance_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_priority ON compliance_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_severity ON compliance_rules(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_applies_to ON compliance_rules(applies_to);

-- Rule execution log indexes
CREATE INDEX IF NOT EXISTS idx_rule_execution_log_user_id ON rule_execution_log(user_id);
CREATE INDEX IF NOT EXISTS idx_rule_execution_log_rule_id ON rule_execution_log(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_execution_log_entity ON rule_execution_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_rule_execution_log_executed_at ON rule_execution_log(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_rule_execution_log_matched ON rule_execution_log(rule_matched);

-- Compliance suggestions indexes
CREATE INDEX IF NOT EXISTS idx_compliance_suggestions_user_id ON compliance_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_suggestions_entity ON compliance_suggestions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_suggestions_type ON compliance_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_compliance_suggestions_severity ON compliance_suggestions(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_suggestions_resolved ON compliance_suggestions(is_resolved);
CREATE INDEX IF NOT EXISTS idx_compliance_suggestions_created_at ON compliance_suggestions(created_at DESC);

-- ============================================================================
-- PART 5: Create Views for Common Queries
-- ============================================================================

-- View: Active compliance rules by priority
CREATE VIEW IF NOT EXISTS v_active_compliance_rules AS
SELECT 
    id,
    rule_name,
    rule_type,
    description,
    rule_conditions,
    rule_actions,
    priority,
    severity,
    applies_to,
    created_at,
    updated_at
FROM compliance_rules
WHERE is_active = 1
ORDER BY priority DESC, id ASC;

-- View: Recent rule executions with details
CREATE VIEW IF NOT EXISTS v_recent_rule_executions AS
SELECT 
    rel.id,
    rel.user_id,
    rel.rule_id,
    cr.rule_name,
    cr.rule_type,
    rel.entity_type,
    rel.entity_id,
    rel.execution_result,
    rel.rule_matched,
    rel.actions_applied,
    rel.executed_at
FROM rule_execution_log rel
LEFT JOIN compliance_rules cr ON rel.rule_id = cr.id
ORDER BY rel.executed_at DESC;

-- View: Unresolved compliance suggestions
CREATE VIEW IF NOT EXISTS v_unresolved_suggestions AS
SELECT 
    cs.id,
    cs.user_id,
    cs.entity_type,
    cs.entity_id,
    cs.suggestion_type,
    cs.title,
    cs.description,
    cs.severity,
    cs.suggested_action,
    cs.created_at,
    CAST((julianday('now') - julianday(cs.created_at)) AS INTEGER) as days_pending
FROM compliance_suggestions cs
WHERE cs.is_resolved = 0
ORDER BY 
    CASE cs.severity 
        WHEN 'error' THEN 1 
        WHEN 'warning' THEN 2 
        WHEN 'info' THEN 3 
    END,
    cs.created_at DESC;

-- View: Rule execution statistics by type
CREATE VIEW IF NOT EXISTS v_rule_execution_stats AS
SELECT 
    cr.rule_type,
    cr.rule_name,
    COUNT(rel.id) as total_executions,
    SUM(CASE WHEN rel.rule_matched = 1 THEN 1 ELSE 0 END) as times_matched,
    SUM(CASE WHEN rel.actions_applied = 1 THEN 1 ELSE 0 END) as times_applied,
    MAX(rel.executed_at) as last_executed
FROM compliance_rules cr
LEFT JOIN rule_execution_log rel ON cr.id = rel.rule_id
WHERE cr.is_active = 1
GROUP BY cr.id, cr.rule_type, cr.rule_name
ORDER BY times_matched DESC;

-- ============================================================================
-- PART 6: Create Triggers for Automatic Updates
-- ============================================================================

-- Trigger: Update compliance_rules.updated_at on update
CREATE TRIGGER IF NOT EXISTS trg_compliance_rules_updated_at
AFTER UPDATE ON compliance_rules
FOR EACH ROW
BEGIN
    UPDATE compliance_rules 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Trigger: Auto-resolve suggestions when entity is deleted
CREATE TRIGGER IF NOT EXISTS trg_auto_resolve_suggestions_on_entity_delete
AFTER UPDATE ON transactions
FOR EACH ROW
WHEN NEW.is_deleted = 1 AND OLD.is_deleted = 0
BEGIN
    UPDATE compliance_suggestions
    SET is_resolved = 1,
        resolved_at = CURRENT_TIMESTAMP
    WHERE entity_type = 'transaction' 
    AND entity_id = NEW.id
    AND is_resolved = 0;
END;

-- ============================================================================
-- PART 7: Insert Default Compliance Rules Based on SAT Requirements
-- ============================================================================

-- Rule 1: Cash Payment Limit ($2,000 MXN)
INSERT INTO compliance_rules (
    rule_name, 
    rule_type, 
    description, 
    rule_conditions, 
    rule_actions, 
    priority, 
    severity, 
    applies_to
) VALUES (
    'Límite de Pago en Efectivo',
    'cash_limit',
    'Pagos en efectivo mayores a $2,000 MXN no son deducibles según el SAT',
    '{"payment_method": {"equals": "cash"}, "amount": {"operator": "gt", "value": 2000}}',
    '{"set_is_isr_deductible": false, "set_is_iva_deductible": false, "set_warning": "⚠️ Pago en efectivo mayor a $2,000. No deducible para ISR/IVA.", "severity": "error"}',
    100,
    'error',
    'expense'
);

-- Rule 2: CFDI Required for Deduction
INSERT INTO compliance_rules (
    rule_name, 
    rule_type, 
    description, 
    rule_conditions, 
    rule_actions, 
    priority, 
    severity, 
    applies_to
) VALUES (
    'CFDI Requerido para Deducción',
    'cfdi_requirement',
    'Sin CFDI válido, el gasto no es deducible de ISR ni acreditable para IVA',
    '{"has_cfdi": {"equals": false}, "type": {"equals": "gasto"}}',
    '{"set_is_isr_deductible": false, "set_is_iva_deductible": false, "set_warning": "⚠️ Sin CFDI: No deducible para ISR/IVA. Obtén factura electrónica.", "severity": "error"}',
    95,
    'error',
    'expense'
);

-- Rule 3: IVA Accreditation Requirements
INSERT INTO compliance_rules (
    rule_name, 
    rule_type, 
    description, 
    rule_conditions, 
    rule_actions, 
    priority, 
    severity, 
    applies_to
) VALUES (
    'Requisitos IVA Acreditable',
    'iva_accreditation',
    'Para acreditar IVA se requiere: CFDI válido, pago realizado, uso empresarial, registro contable',
    '{"has_cfdi": {"equals": true}, "is_isr_deductible": {"equals": true}, "iva_amount": {"operator": "gt", "value": 0}}',
    '{"set_is_iva_deductible": true, "set_info": "✓ Cumple requisitos para IVA acreditable", "severity": "info"}',
    90,
    'info',
    'expense'
);

-- Rule 4: Foreign Client 0% IVA
INSERT INTO compliance_rules (
    rule_name, 
    rule_type, 
    description, 
    rule_conditions, 
    rule_actions, 
    priority, 
    severity, 
    applies_to
) VALUES (
    'Cliente Extranjero - IVA 0%',
    'foreign_client',
    'Servicios a clientes del extranjero pueden aplicar tasa 0% de IVA',
    '{"client_type": {"equals": "extranjero"}, "type": {"equals": "ingreso"}}',
    '{"set_iva_rate": 0, "set_info": "ℹ️ Cliente extranjero: Aplica IVA tasa 0% si cumple requisitos (pago del extranjero, servicio calificado)", "severity": "info"}',
    85,
    'info',
    'income'
);

-- Rule 5: Vehicle Deduction Limit
INSERT INTO compliance_rules (
    rule_name, 
    rule_type, 
    description, 
    rule_conditions, 
    rule_actions, 
    priority, 
    severity, 
    applies_to
) VALUES (
    'Límite Deducción Vehículos',
    'vehicle_deduction',
    'Vehículos: deducible solo si cuesta menos de $175,000 (o $250,000 si es híbrido/eléctrico)',
    '{"category": {"contains": ["transporte", "vehículo", "auto", "gasolina"]}, "amount": {"operator": "gt", "value": 175000}}',
    '{"set_warning": "⚠️ Vehículos >$175,000: deducción proporcional. Revisar si es híbrido/eléctrico (límite $250,000).", "severity": "warning"}',
    80,
    'warning',
    'expense'
);

-- Rule 6: International Expense Without Invoice
INSERT INTO compliance_rules (
    rule_name, 
    rule_type, 
    description, 
    rule_conditions, 
    rule_actions, 
    priority, 
    severity, 
    applies_to
) VALUES (
    'Gasto Internacional Sin CFDI',
    'expense_classification',
    'Gastos internacionales sin factura mexicana requieren documentación equivalente',
    '{"expense_type": {"equals": "international_no_invoice"}}',
    '{"set_is_isr_deductible": false, "set_is_iva_deductible": false, "set_warning": "⚠️ Gasto internacional sin CFDI: No deducible. Obtén comprobante equivalente.", "severity": "error"}',
    75,
    'error',
    'expense'
);

-- Rule 7: Personal Expenses Not Deductible
INSERT INTO compliance_rules (
    rule_name, 
    rule_type, 
    description, 
    rule_conditions, 
    rule_actions, 
    priority, 
    severity, 
    applies_to
) VALUES (
    'Gastos Personales No Deducibles',
    'expense_classification',
    'Gastos personales sin relación con actividad empresarial no son deducibles',
    '{"transaction_type": {"equals": "personal"}}',
    '{"set_is_isr_deductible": false, "set_is_iva_deductible": false, "set_info": "ℹ️ Gasto personal: No deducible para negocio. Puede ser deducción personal anual si aplica.", "severity": "info"}',
    70,
    'info',
    'expense'
);

-- Rule 8: Business Expense Validation
INSERT INTO compliance_rules (
    rule_name, 
    rule_type, 
    description, 
    rule_conditions, 
    rule_actions, 
    priority, 
    severity, 
    applies_to
) VALUES (
    'Validación Gasto Empresarial',
    'isr_deduction',
    'Gasto empresarial con CFDI: verificar que sea estrictamente indispensable',
    '{"transaction_type": {"equals": "business"}, "has_cfdi": {"equals": true}}',
    '{"set_info": "✓ Gasto empresarial con CFDI. Verifica que sea estrictamente indispensable para la actividad.", "severity": "info"}',
    65,
    'info',
    'expense'
);

-- Rule 9: Income CFDI Requirement
INSERT INTO compliance_rules (
    rule_name, 
    rule_type, 
    description, 
    rule_conditions, 
    rule_actions, 
    priority, 
    severity, 
    applies_to
) VALUES (
    'CFDI Requerido para Ingresos',
    'cfdi_requirement',
    'Todos los ingresos deben estar respaldados con CFDI emitido',
    '{"type": {"equals": "ingreso"}, "has_cfdi": {"equals": false}}',
    '{"set_warning": "⚠️ Ingreso sin CFDI emitido. Genera tu factura electrónica.", "severity": "warning"}',
    60,
    'warning',
    'income'
);

-- Rule 10: Payment Method Electronic Requirement
INSERT INTO compliance_rules (
    rule_name, 
    rule_type, 
    description, 
    rule_conditions, 
    rule_actions, 
    priority, 
    severity, 
    applies_to
) VALUES (
    'Método de Pago Electrónico',
    'payment_method',
    'Gastos mayores a $2,000 deben pagarse con medio electrónico (transferencia, tarjeta, cheque)',
    '{"amount": {"operator": "gt", "value": 2000}, "payment_method": {"not_in": ["transfer", "card", "check"]}}',
    '{"set_warning": "⚠️ Gastos >$2,000 requieren pago electrónico para ser deducibles.", "severity": "warning"}',
    55,
    'warning',
    'expense'
);

-- ============================================================================
-- PART 8: Create Function Helper for Rule Evaluation (Documentation)
-- ============================================================================

-- Note: The actual rule evaluation logic will be implemented in the backend API
-- (functions/api/compliance-engine.js) using JavaScript.
-- 
-- Rule Condition Operators:
--   - equals: exact match
--   - not_equals: not equal
--   - gt: greater than
--   - gte: greater than or equal
--   - lt: less than
--   - lte: less than or equal
--   - contains: array/string contains value
--   - not_contains: array/string does not contain value
--   - in: value in array
--   - not_in: value not in array
--   - exists: field exists and is not null
--   - not_exists: field is null or undefined
--
-- Rule Actions:
--   - set_is_isr_deductible: boolean
--   - set_is_iva_deductible: boolean
--   - set_iva_rate: number (0, 16)
--   - set_warning: string (warning message)
--   - set_info: string (info message)
--   - set_error: string (error message)
--   - set_suggestion: object {type, title, description, action}
--   - severity: 'info' | 'warning' | 'error' | 'blocking'

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Add migration tracking
INSERT INTO migrations (version, name, applied_at) 
SELECT 32, 'add_compliance_rules_engine', CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='migrations')
  AND NOT EXISTS (SELECT 1 FROM migrations WHERE version = 32);
