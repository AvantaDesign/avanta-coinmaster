# 🗄️ Database Tracking System
## Avanta Coinmaster - Complete Database Management

> **CRITICAL**: This system prevents database setup issues during AI-assisted development

---

## 📊 **Current Database Status (Verified)**

### **Tables (43 Total)**
| # | Table Name | Purpose | API Usage | Status |
|---|------------|---------|-----------|--------|
| 1 | `account_initial_balances` | Account opening balances | ✅ | ✅ |
| 2 | `accounts` | User bank accounts | ✅ | ✅ |
| 3 | `audit_log` | System audit trail | ✅ | ✅ |
| 4 | `bank_statements` | Bank statement imports | ✅ | ✅ |
| 5 | `budgets` | Budget management | ✅ | ✅ |
| 6 | `categories` | Transaction categories | ✅ | ✅ |
| 7 | `cfdi_metadata` | CFDI document metadata | ✅ | ✅ |
| 8 | `contabilidad_electronica_files` | Electronic accounting files | ✅ | ✅ |
| 9 | `credit_movements` | Credit card movements | ✅ | ✅ |
| 10 | `credits` | Credit cards & loans | ✅ | ✅ |
| 11 | `declaration_steps` | SAT declaration steps | ✅ | ✅ |
| 12 | `deductibility_rules` | Custom deductibility rules | ✅ | ✅ |
| 13 | `demo_data_snapshots` | Demo scenario data | ✅ | ✅ |
| 14 | `demo_scenarios` | Demo scenarios | ✅ | ✅ |
| 15 | `demo_sessions` | Demo user sessions | ✅ | ✅ |
| 16 | `digital_archive` | Document archive | ✅ | ✅ |
| 17 | `diot_operations` | DIOT operations | ✅ | ✅ |
| 18 | `financial_tasks` | Financial task management | ✅ | ✅ |
| 19 | `fiscal_certificates` | Fiscal certificates | ✅ | ✅ |
| 20 | `fiscal_config` | User fiscal configuration | ✅ | ✅ |
| 21 | `fiscal_parameters` | Tax parameters | ✅ | ✅ |
| 22 | `fiscal_payments` | Tax payments | ✅ | ✅ |
| 23 | `help_articles` | Help system articles | ✅ | ✅ |
| 24 | `help_categories` | Help system categories | ✅ | ✅ |
| 25 | `help_feedback` | Help system feedback | ✅ | ✅ |
| 26 | `invoices` | Invoice management | ✅ | ✅ |
| 27 | `receipts` | Receipt attachments | ✅ | ✅ |
| 28 | `reconciliation_matches` | Bank reconciliation | ✅ | ✅ |
| 29 | `sat_accounts_catalog` | SAT accounts catalog | ✅ | ✅ |
| 30 | `sat_declarations` | SAT declarations | ✅ | ✅ |
| 31 | `simulation_results` | Tax simulation results | ✅ | ✅ |
| 32 | `task_progress` | Task progress tracking | ✅ | ✅ |
| 33 | `task_templates` | Task templates | ✅ | ✅ |
| 34 | `tax_calculations` | Tax calculations | ✅ | ✅ |
| 35 | `tax_credits` | Tax credits | ✅ | ✅ |
| 36 | `tax_deductions` | Tax deductions | ✅ | ✅ |
| 37 | `tax_simulations` | Tax simulations | ✅ | ✅ |
| 38 | `transaction_invoice_map` | Transaction-invoice mapping | ✅ | ✅ |
| 39 | `transactions` | Core transactions | ✅ | ✅ |
| 40 | `user_declaration_progress` | User declaration progress | ✅ | ✅ |
| 41 | `user_onboarding_progress` | User onboarding progress | ✅ | ✅ |
| 42 | `user_settings` | User preferences | ✅ | ✅ |
| 43 | `users` | User accounts | ✅ | ✅ |

### **Views (7 Total)**
| # | View Name | Purpose | Status |
|---|----------|---------|--------|
| 1 | `cfdi_duplicates` | CFDI duplicate detection | ✅ |
| 2 | `cfdi_unlinked` | Unlinked CFDI tracking | ✅ |
| 3 | `v_annual_tax_summary` | Annual tax summaries | ✅ |
| 4 | `v_monthly_tax_summary` | Monthly tax summaries | ✅ |
| 5 | `v_reconciliation_summary` | Reconciliation status | ✅ |
| 6 | `v_unmatched_bank_statements` | Unmatched bank statements | ✅ |
| 7 | `v_unmatched_transactions` | Unmatched transactions | ✅ |

---

## 🔄 **Applied Migrations**

### **Core Migrations Applied**
- ✅ `018_add_sat_declarations.sql` - SAT declarations system
- ✅ `019_add_fiscal_parameters.sql` - Tax parameters
- ✅ `022_add_tax_simulation.sql` - Tax simulation system
- ✅ `024_add_income_fiscal_foundations.sql` - Fiscal foundations + SAT catalog
- ✅ `025_add_cfdi_management.sql` - CFDI management
- ✅ `026_add_tax_calculation_engine.sql` - Tax calculation engine
- ✅ `027_add_bank_reconciliation.sql` - Bank reconciliation
- ✅ `041_add_demo_system.sql` - Demo system
- ✅ `042_add_help_system.sql` - Help system
- ✅ `seed_fiscal_parameters.sql` - Fiscal parameters data

### **Manual Table Creations**
- ✅ `invoices` - Invoice management
- ✅ `receipts` - Receipt attachments
- ✅ `audit_log` - Audit logging
- ✅ `deductibility_rules` - Deductibility rules
- ✅ `digital_archive` - Digital archive
- ✅ `diot_operations` - DIOT operations
- ✅ `contabilidad_electronica_files` - Electronic accounting files
- ✅ `account_initial_balances` - Account balances
- ✅ `fiscal_payments` - Tax payments
- ✅ `credits` - Credit management
- ✅ `credit_movements` - Credit movements
- ✅ `budgets` - Budget management
- ✅ `fiscal_config` - Fiscal configuration
- ✅ `transaction_invoice_map` - Transaction-invoice mapping
- ✅ `user_declaration_progress` - Declaration progress

---

## 🚨 **CRITICAL RULES FOR AI AGENTS**

### **Before Any Development Work**
1. **ALWAYS** check this file first
2. **ALWAYS** verify database requirements before coding
3. **ALWAYS** apply migrations before testing
4. **NEVER** assume tables exist without verification

### **Database Commands Reference**
```bash
# Check existing tables
wrangler d1 execute avanta-coinmaster --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Check existing views
wrangler d1 execute avanta-coinmaster --command="SELECT name FROM sqlite_master WHERE type='view' ORDER BY name;"

# Apply migration
wrangler d1 execute avanta-coinmaster --file=migrations/XXX_migration_name.sql

# Check table structure
wrangler d1 execute avanta-coinmaster --command="PRAGMA table_info(table_name);"

# Test database health
wrangler d1 execute avanta-coinmaster --command="SELECT 'Database OK' as status;"
```

### **API Endpoint Database Requirements**
| API Endpoint | Required Tables | Required Views |
|--------------|-----------------|----------------|
| `/api/transactions` | `transactions`, `users`, `categories`, `accounts` | - |
| `/api/sat-declarations` | `sat_declarations`, `diot_operations`, `contabilidad_electronica_files`, `sat_accounts_catalog`, `cfdi_metadata` | - |
| `/api/tax-calculations` | `tax_calculations`, `transactions`, `fiscal_parameters` | `v_annual_tax_summary`, `v_monthly_tax_summary` |
| `/api/tax-simulation` | `tax_simulations`, `tax_deductions`, `tax_credits`, `simulation_results` | - |
| `/api/receipts` | `receipts`, `transactions`, `users` | - |
| `/api/audit-log` | `audit_log`, `users` | - |
| `/api/deductibility-rules` | `deductibility_rules`, `users`, `categories` | - |
| `/api/digital-archive` | `digital_archive`, `users` | - |
| `/api/fiscal-certificates` | `fiscal_certificates`, `users` | - |
| `/api/task-engine` | `financial_tasks`, `task_templates`, `task_progress`, `user_declaration_progress`, `bank_statements`, `transactions`, `invoices`, `budgets` | - |
| `/api/help-center` | `help_categories`, `help_articles`, `help_feedback`, `users` | - |
| `/api/onboarding` | `user_onboarding_progress`, `users` | - |
| `/api/tax-reports` | `tax_calculations`, `transactions`, `fiscal_config` | `v_annual_tax_summary`, `v_monthly_tax_summary` |

---

## 📋 **Development Checklist**

### **Before Starting Any Feature**
- [ ] Check if new tables are needed
- [ ] Verify existing tables have required columns
- [ ] Check if migrations need to be applied
- [ ] Update this tracking document

### **After Adding New Features**
- [ ] Document new tables/views in this file
- [ ] Update API endpoint requirements
- [ ] Test all affected endpoints
- [ ] Verify database health

### **Before Deployment**
- [ ] Run full database verification
- [ ] Test all API endpoints
- [ ] Verify all migrations applied
- [ ] Check database health status

---

## 🔧 **Database Maintenance Commands**

### **Verification Script**
```bash
#!/bin/bash
echo "🔍 Database Verification"
echo "========================"

echo "📊 Tables:"
wrangler d1 execute avanta-coinmaster --command="SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf_%';"

echo "📈 Views:"
wrangler d1 execute avanta-coinmaster --command="SELECT COUNT(*) as view_count FROM sqlite_master WHERE type='view';"

echo "✅ Health Check:"
wrangler d1 execute avanta-coinmaster --command="SELECT 'Database OK' as status;"

echo "🎯 Expected: 43 tables, 7 views"
```

### **Migration Status Check**
```bash
# Check which migrations have been applied
ls migrations/ | grep -E "\.sql$" | sort
```

---

## 📝 **Change Log**

### **2025-10-21 - Initial Setup**
- ✅ Created comprehensive database tracking system
- ✅ Verified all 43 tables exist and are properly configured
- ✅ Verified all 7 views are created and functional
- ✅ Applied all necessary migrations
- ✅ Tested critical API endpoints
- ✅ Database health status: HEALTHY

---

## 🎯 **Next Steps for AI Agents**

1. **Always reference this file** before making database changes
2. **Update this file** when adding new tables/views
3. **Test thoroughly** after any database modifications
4. **Maintain this tracking system** as the single source of truth

---

> **⚠️ WARNING**: This system prevents the database setup issues that occurred during previous development phases. Always check this file first!
