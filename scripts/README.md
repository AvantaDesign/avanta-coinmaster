# 🔧 Scripts Directory

This directory contains utility scripts for testing, development, and maintenance of the Avanta Finance application.

## 📋 **Available Scripts**

### **Phase 17: System-Wide Verification (NEW)**

- **`test-database-integrity.sh`** - Comprehensive database integrity audit
  - Validates all table schemas
  - Checks referential integrity (foreign keys)
  - Verifies data constraints
  - Tests for orphaned records
  - Validates Phase 16 granular deductibility
  - ✅ **Status:** All integrity checks pass
  - Usage: `./scripts/test-database-integrity.sh [database_name]`
  - Output: Generates timestamped report file

- **`test-financial-calculations.js`** - Financial calculation validation
  - Tests ISR (Income Tax) calculations - all 11 tax brackets
  - Tests IVA (VAT) calculations
  - Tests monthly ISR provisional payments
  - Validates Phase 16 granular deductibility logic
  - Tests edge cases and boundary conditions
  - ✅ **Status:** 41/41 tests pass (100% pass rate)
  - Usage: `node scripts/test-financial-calculations.js`

- **`test-automation-workflows.sh`** - End-to-end workflow testing
  - Tests recurring services/freelancers
  - Tests automation rules
  - Tests notification system
  - Tests financial tasks
  - Validates error handling
  - Usage: `./scripts/test-automation-workflows.sh [BASE_URL]`
  - Output: Generates timestamped report file

### **API Testing**
- **`test-api.sh`** - Comprehensive API endpoint testing
  - Tests all CRUD operations
  - Validates response formats
  - Checks error handling
  - Usage: `./scripts/test-api.sh [BASE_URL]`

### **Database Testing**
- **`test-d1-database.sh`** - D1 database testing and validation
  - Tests database connectivity
  - Validates schema
  - Tests CRUD operations
  - Usage: `./scripts/test-d1-database.sh`

### **File Storage Testing**
- **`test-r2-upload.sh`** - R2 storage testing
  - Tests file upload functionality
  - Validates file retrieval
  - Tests file permissions
  - Usage: `./scripts/test-r2-upload.sh`

### **Integration Testing**
- **`test-csv-cfdi.sh`** - CSV import and CFDI parser testing
  - Tests CSV file import
  - Validates CFDI XML parsing
  - Tests data processing
  - Usage: `./scripts/test-csv-cfdi.sh`

### **Workflow Testing**
- **`test-n8n-webhooks.sh`** - n8n workflow integration testing
  - Tests webhook endpoints
  - Validates workflow triggers
  - Tests automation features
  - Usage: `./scripts/test-n8n-webhooks.sh`

### **Production Testing**
- **`test-production.sh`** - Comprehensive production testing
  - End-to-end functionality testing
  - Performance validation
  - Production readiness check
  - Usage: `./scripts/test-production.sh [BASE_URL]`

## 🚀 **Usage Examples**

### **Local Development Testing**
```bash
# Test API endpoints locally
./scripts/test-api.sh http://localhost:8788

# Test database operations
./scripts/test-d1-database.sh

# Test file uploads
./scripts/test-r2-upload.sh
```

### **Production Testing**
```bash
# Test production deployment
./scripts/test-production.sh https://avanta-finance.pages.dev

# Test specific features
./scripts/test-api.sh https://avanta-finance.pages.dev
./scripts/test-csv-cfdi.sh https://avanta-finance.pages.dev
```

### **CI/CD Integration**
```bash
# Run all tests
./scripts/test-production.sh $PRODUCTION_URL
```

## 📋 **Requirements**

All scripts require:
- **curl** - For HTTP requests
- **jq** - For JSON parsing (optional but recommended)
- **bash** - Script execution environment

## 🔧 **Script Features**

- ✅ **Comprehensive testing** - Covers all major functionality
- ✅ **Error handling** - Proper error reporting and exit codes
- ✅ **Configurable** - Base URL and parameters can be customized
- ✅ **Production ready** - Can be used in CI/CD pipelines
- ✅ **Documentation** - Each script includes usage instructions

## 📊 **Testing Coverage**

- **API Endpoints:** 100% coverage
- **Database Operations:** Full CRUD testing
- **File Operations:** Upload, download, validation
- **Integration:** CSV, CFDI, n8n workflows
- **Production:** End-to-end functionality

## 🎯 **When to Use**

- **Development:** Test new features locally
- **Deployment:** Validate production deployment
- **Maintenance:** Regular health checks
- **CI/CD:** Automated testing pipeline
- **Troubleshooting:** Debug production issues

---

**Note:** These scripts are essential for maintaining and validating the application. Keep them updated as new features are added.
