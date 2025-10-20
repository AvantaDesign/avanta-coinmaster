-- Migration 040: Enhance Task System with Progress Tracking and Declarations
-- Phase 36: Task System Redesign as Interactive Guide
-- Created: January 2025

-- ============================================================================
-- ENHANCE FINANCIAL TASKS TABLE
-- ============================================================================
-- Add new columns for automatic progress tracking and completion criteria

-- Add completion criteria (JSON format for flexible criteria definition)
ALTER TABLE financial_tasks ADD COLUMN completion_criteria TEXT;

-- Add progress percentage (0-100)
ALTER TABLE financial_tasks ADD COLUMN progress_percentage INTEGER DEFAULT 0 CHECK(progress_percentage >= 0 AND progress_percentage <= 100);

-- Add last evaluation timestamp
ALTER TABLE financial_tasks ADD COLUMN last_evaluated_at TEXT;

-- Add auto-update flag to enable/disable automatic progress tracking
ALTER TABLE financial_tasks ADD COLUMN auto_update INTEGER DEFAULT 1 CHECK(auto_update IN (0, 1));

-- Add task type to distinguish between different task categories
ALTER TABLE financial_tasks ADD COLUMN task_type TEXT DEFAULT 'manual' CHECK(task_type IN ('manual', 'auto', 'declaration', 'custom'));

-- Add notes field for task-specific notes
ALTER TABLE financial_tasks ADD COLUMN notes TEXT;

-- ============================================================================
-- TASK TEMPLATES TABLE
-- ============================================================================
-- Predefined task templates for quick task creation
CREATE TABLE IF NOT EXISTS task_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK(template_type IN ('monthly', 'annual', 'quarterly', 'custom', 'declaration')),
    description TEXT,
    completion_criteria TEXT NOT NULL, -- JSON with criteria structure
    priority INTEGER DEFAULT 1 CHECK(priority >= 1 AND priority <= 5), -- 1=highest, 5=lowest
    category TEXT,
    estimated_duration INTEGER, -- Estimated duration in minutes
    help_text TEXT, -- Guidance text for users
    default_auto_update INTEGER DEFAULT 1 CHECK(default_auto_update IN (0, 1)),
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster template lookups
CREATE INDEX IF NOT EXISTS idx_task_templates_type ON task_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_task_templates_active ON task_templates(is_active);

-- ============================================================================
-- TASK PROGRESS TABLE
-- ============================================================================
-- Historical tracking of task progress and completion
CREATE TABLE IF NOT EXISTS task_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    progress_percentage INTEGER DEFAULT 0 CHECK(progress_percentage >= 0 AND progress_percentage <= 100),
    completion_data TEXT, -- JSON with detailed completion information
    evaluation_criteria TEXT, -- JSON snapshot of criteria used for evaluation
    evaluated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES financial_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for faster progress queries
CREATE INDEX IF NOT EXISTS idx_task_progress_task_id ON task_progress(task_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_user_id ON task_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_evaluated_at ON task_progress(evaluated_at DESC);

-- ============================================================================
-- DECLARATION STEPS TABLE
-- ============================================================================
-- Interactive guide steps for fiscal declarations (ISR, IVA, DIOT)
CREATE TABLE IF NOT EXISTS declaration_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    declaration_type TEXT NOT NULL CHECK(declaration_type IN ('isr', 'iva', 'diot', 'annual_isr', 'annual_iva')),
    step_number INTEGER NOT NULL,
    step_title TEXT NOT NULL,
    step_description TEXT,
    step_criteria TEXT, -- JSON with completion criteria for this step
    required_fields TEXT, -- JSON array of required data fields
    help_text TEXT, -- Contextual help and explanations
    validation_rules TEXT, -- JSON with validation rules
    common_errors TEXT, -- JSON array of common mistakes to avoid
    is_required INTEGER DEFAULT 1 CHECK(is_required IN (0, 1)),
    estimated_time INTEGER, -- Estimated time in minutes
    display_order INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(declaration_type, step_number)
);

-- Index for faster step lookups
CREATE INDEX IF NOT EXISTS idx_declaration_steps_type ON declaration_steps(declaration_type);
CREATE INDEX IF NOT EXISTS idx_declaration_steps_order ON declaration_steps(display_order);

-- ============================================================================
-- USER DECLARATION PROGRESS TABLE
-- ============================================================================
-- Track user progress through declaration guides
CREATE TABLE IF NOT EXISTS user_declaration_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    declaration_type TEXT NOT NULL CHECK(declaration_type IN ('isr', 'iva', 'diot', 'annual_isr', 'annual_iva')),
    declaration_period TEXT NOT NULL, -- Format: 'YYYY-MM' for monthly, 'YYYY' for annual
    current_step INTEGER DEFAULT 1,
    completed_steps TEXT, -- JSON array of completed step IDs
    step_data TEXT, -- JSON with data collected for each step
    overall_progress INTEGER DEFAULT 0 CHECK(overall_progress >= 0 AND overall_progress <= 100),
    status TEXT DEFAULT 'in_progress' CHECK(status IN ('not_started', 'in_progress', 'completed', 'submitted')),
    started_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    last_updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, declaration_type, declaration_period)
);

-- Indexes for declaration progress
CREATE INDEX IF NOT EXISTS idx_user_declaration_progress_user_id ON user_declaration_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_declaration_progress_type ON user_declaration_progress(declaration_type);
CREATE INDEX IF NOT EXISTS idx_user_declaration_progress_status ON user_declaration_progress(status);

-- ============================================================================
-- INSERT DEFAULT TASK TEMPLATES
-- ============================================================================

-- Monthly ISR Declaration Template
INSERT INTO task_templates (
    template_name, template_type, description, completion_criteria, priority, 
    category, estimated_duration, help_text
) VALUES (
    'Declaración ISR Mensual',
    'monthly',
    'Declaración mensual de Impuesto Sobre la Renta',
    '{"type": "declaration", "declaration_type": "isr", "steps_required": 5, "validation": ["income_recorded", "deductions_calculated", "payment_prepared"]}',
    1,
    'tax',
    60,
    'Presenta tu declaración mensual de ISR antes del día 17 del mes siguiente.'
);

-- Monthly IVA Declaration Template
INSERT INTO task_templates (
    template_name, template_type, description, completion_criteria, priority, 
    category, estimated_duration, help_text
) VALUES (
    'Declaración IVA Mensual',
    'monthly',
    'Declaración mensual de Impuesto al Valor Agregado',
    '{"type": "declaration", "declaration_type": "iva", "steps_required": 4, "validation": ["invoices_uploaded", "iva_calculated", "payment_ready"]}',
    1,
    'tax',
    45,
    'Presenta tu declaración de IVA antes del día 17 del mes siguiente.'
);

-- DIOT Declaration Template
INSERT INTO task_templates (
    template_name, template_type, description, completion_criteria, priority, 
    category, estimated_duration, help_text
) VALUES (
    'Declaración Informativa DIOT',
    'monthly',
    'Declaración Informativa de Operaciones con Terceros',
    '{"type": "declaration", "declaration_type": "diot", "steps_required": 3, "validation": ["vendors_identified", "operations_classified", "file_generated"]}',
    2,
    'tax',
    30,
    'Presenta tu DIOT antes del día 17 del mes siguiente si tuviste operaciones con terceros.'
);

-- Bank Reconciliation Template
INSERT INTO task_templates (
    template_name, template_type, description, completion_criteria, priority, 
    category, estimated_duration, help_text
) VALUES (
    'Conciliación Bancaria',
    'monthly',
    'Conciliación de estados de cuenta bancarios',
    '{"type": "reconciliation", "criteria": ["statement_uploaded", "transactions_matched", "differences_resolved"], "threshold": 100}',
    2,
    'reconciliation',
    45,
    'Concilia tus cuentas bancarias mensualmente para mantener registros precisos.'
);

-- Invoice Review Template
INSERT INTO task_templates (
    template_name, template_type, description, completion_criteria, priority, 
    category, estimated_duration, help_text
) VALUES (
    'Revisión de Facturas',
    'monthly',
    'Revisión y validación de facturas emitidas y recibidas',
    '{"type": "review", "criteria": ["invoices_uploaded", "invoices_validated", "mismatches_resolved"], "min_percentage": 95}',
    2,
    'invoices',
    30,
    'Revisa y valida todas tus facturas para asegurar cumplimiento fiscal.'
);

-- Financial Report Generation Template
INSERT INTO task_templates (
    template_name, template_type, description, completion_criteria, priority, 
    category, estimated_duration, help_text
) VALUES (
    'Generación de Reportes Financieros',
    'monthly',
    'Genera reportes de ingresos, gastos y utilidades',
    '{"type": "report", "criteria": ["income_report_generated", "expense_report_generated", "profit_calculated"], "required_reports": 3}',
    3,
    'reports',
    20,
    'Genera tus reportes financieros mensuales para análisis y toma de decisiones.'
);

-- Budget Review Template
INSERT INTO task_templates (
    template_name, template_type, description, completion_criteria, priority, 
    category, estimated_duration, help_text
) VALUES (
    'Revisión Presupuestaria',
    'monthly',
    'Compara gastos reales contra presupuesto',
    '{"type": "budget_review", "criteria": ["budget_comparison", "variances_identified", "adjustments_planned"], "variance_threshold": 10}',
    3,
    'budget',
    25,
    'Revisa mensualmente tu presupuesto para identificar desviaciones y ajustar.'
);

-- Annual Tax Return Template
INSERT INTO task_templates (
    template_name, template_type, description, completion_criteria, priority, 
    category, estimated_duration, help_text
) VALUES (
    'Declaración Anual',
    'annual',
    'Declaración anual de impuestos',
    '{"type": "declaration", "declaration_type": "annual_isr", "steps_required": 10, "validation": ["all_monthly_complete", "deductions_prepared", "supporting_docs_ready"]}',
    1,
    'tax',
    180,
    'Presenta tu declaración anual antes del 30 de abril.'
);

-- ============================================================================
-- INSERT DEFAULT DECLARATION STEPS
-- ============================================================================

-- ISR Monthly Declaration Steps
INSERT INTO declaration_steps (
    declaration_type, step_number, step_title, step_description, 
    required_fields, help_text, is_required, estimated_time, display_order
) VALUES
('isr', 1, 'Verificar Ingresos del Periodo', 
 'Revisa y confirma todos los ingresos registrados en el periodo',
 '["total_income", "invoice_count", "payment_receipts"]',
 'Asegúrate de que todos tus ingresos estén correctamente registrados y respaldados con facturas.',
 1, 15, 1),

('isr', 2, 'Calcular Deducciones Autorizadas',
 'Identifica y calcula todas las deducciones fiscales aplicables',
 '["deductible_expenses", "deduction_percentage", "supporting_docs"]',
 'Solo incluye gastos estrictamente indispensables y que cumplan con requisitos fiscales.',
 1, 20, 2),

('isr', 3, 'Determinar Base Gravable',
 'Calcula la base sobre la cual se aplicará el ISR',
 '["gross_income", "authorized_deductions", "taxable_base"]',
 'La base gravable es la diferencia entre ingresos y deducciones autorizadas.',
 1, 10, 3),

('isr', 4, 'Calcular ISR a Pagar',
 'Aplica la tasa de ISR correspondiente a tu régimen',
 '["taxable_base", "isr_rate", "isr_amount", "retention_amount"]',
 'Considera retenciones que te hayan aplicado para determinar el monto neto a pagar.',
 1, 10, 4),

('isr', 5, 'Preparar Pago',
 'Genera la línea de captura y prepara el pago del ISR',
 '["payment_amount", "payment_reference", "due_date"]',
 'El pago debe realizarse a más tardar el día 17 del mes siguiente al que se declara.',
 1, 5, 5);

-- IVA Monthly Declaration Steps
INSERT INTO declaration_steps (
    declaration_type, step_number, step_title, step_description,
    required_fields, help_text, is_required, estimated_time, display_order
) VALUES
('iva', 1, 'Calcular IVA Cobrado',
 'Suma el IVA de todas las facturas emitidas en el periodo',
 '["invoices_issued", "iva_collected", "exempt_sales"]',
 'Incluye todo el IVA que cobraste en tus ventas o servicios.',
 1, 10, 1),

('iva', 2, 'Calcular IVA Acreditable',
 'Suma el IVA de gastos deducibles que puedes acreditar',
 '["deductible_purchases", "iva_creditable", "non_creditable_iva"]',
 'Solo es acreditable el IVA de gastos estrictamente indispensables para tu actividad.',
 1, 15, 2),

('iva', 3, 'Determinar IVA a Pagar o a Favor',
 'Calcula la diferencia entre IVA cobrado y acreditable',
 '["iva_collected", "iva_creditable", "iva_balance"]',
 'Si el IVA cobrado es mayor, tienes IVA a pagar. Si es menor, saldo a favor.',
 1, 5, 3),

('iva', 4, 'Preparar Pago o Solicitar Devolución',
 'Genera línea de captura para pago o prepara solicitud de devolución',
 '["iva_amount", "payment_reference", "due_date"]',
 'El pago de IVA debe realizarse antes del día 17 del mes siguiente.',
 1, 5, 4);

-- DIOT Declaration Steps
INSERT INTO declaration_steps (
    declaration_type, step_number, step_title, step_description,
    required_fields, help_text, is_required, estimated_time, display_order
) VALUES
('diot', 1, 'Identificar Proveedores',
 'Lista todos los proveedores con los que tuviste operaciones',
 '["vendor_list", "rfc_list", "vendor_types"]',
 'Incluye todos los proveedores nacionales y extranjeros del periodo.',
 1, 10, 1),

('diot', 2, 'Clasificar Operaciones',
 'Clasifica las operaciones según tipo de IVA (16%, 0%, exento)',
 '["operations_16", "operations_0", "exempt_operations", "foreign_operations"]',
 'Separa correctamente las operaciones según la tasa de IVA aplicable.',
 1, 15, 2),

('diot', 3, 'Generar Archivo TXT',
 'Genera el archivo en formato requerido por el SAT',
 '["txt_file", "record_count", "validation_status"]',
 'El archivo debe cumplir con el formato oficial del SAT para DIOT.',
 1, 5, 3);

-- ============================================================================
-- TRIGGERS FOR TIMESTAMP UPDATES
-- ============================================================================

-- Update task_templates timestamp on update
CREATE TRIGGER IF NOT EXISTS update_task_templates_timestamp 
AFTER UPDATE ON task_templates
BEGIN
    UPDATE task_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update user_declaration_progress timestamp on update
CREATE TRIGGER IF NOT EXISTS update_user_declaration_progress_timestamp 
AFTER UPDATE ON user_declaration_progress
BEGIN
    UPDATE user_declaration_progress SET last_updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
