# 🤖 GitHub Copilot Agent Session Prompt - Avanta CoinMaster 2.0
## Phase 0 Complete: Advanced Import/Export + Smart Automation (Sections 4 & 5)

## Project Context
You are working on **Avanta CoinMaster 2.0**, a financial management application for Personas Físicas con Actividad Empresarial (PFAE) in Mexico. We're transforming it from a basic transaction aggregator into an intelligent financial assistant.

## Current Status
- ✅ **Phase 0, Section 1: COMPLETE** - Table interactions, filtering, search, sorting, bulk operations
- ✅ **Phase 0, Section 2: COMPLETE** - Data visualization, account breakdown, period controls, mobile card view
- ✅ **Phase 0, Section 3: COMPLETE** - Account & category management (CRUD), filter persistence
- ✅ **Production Ready:** React frontend + Cloudflare Workers backend + D1 database + R2 storage
- ✅ **Deployed:** Live at Cloudflare Pages with full functionality

## This Session: Complete Phase 0 - Advanced Features

**Objective:** Complete Phase 0 by implementing advanced import/export capabilities and smart automation features in one comprehensive session.

### Features to Implement (4 total):

#### Section 4: Enhanced Import/Export
1. **Column Mapping for CSV Import** - Drag-and-drop column mapping interface
2. **Export Current View to CSV/Excel** - Export filtered/sorted data with metadata

#### Section 5: Smart Automation
3. **Toast Notifications** - Success/error notifications for all actions
4. **Smart Category Suggestions** - AI-powered category suggestions based on history

### Files to Create/Modify:

#### New Components (4):
- **NEW:** `src/components/CSVImportMapper.jsx` - Column mapping interface with drag-and-drop
- **NEW:** `src/components/ExportDialog.jsx` - Export options dialog (CSV/Excel)
- **NEW:** `src/components/ToastNotification.jsx` - Toast notification system
- **NEW:** `src/components/SmartSuggestions.jsx` - Category suggestion component

#### Enhanced Components (6):
- `src/components/CSVImport.jsx` - Add column mapping functionality
- `src/pages/Transactions.jsx` - Add export button and smart suggestions
- `src/components/TransactionTable.jsx` - Add export button and toast integration
- `src/components/AddTransaction.jsx` - Add smart category suggestions
- `src/utils/api.js` - Add export and suggestion API functions
- `src/utils/csvParser.js` - Enhance with mapping support

#### Backend APIs (2):
- `functions/api/upload.js` - Enhanced CSV processing with mapping
- `functions/api/transactions.js` - Add export endpoint and suggestion logic

#### New Utilities (2):
- **NEW:** `src/utils/notifications.js` - Toast notification management
- **NEW:** `src/utils/suggestions.js` - Category suggestion algorithms

## Implementation Plan

### Step 1: Advanced CSV Import with Column Mapping (1,500 lines)
- Create drag-and-drop column mapping interface
- Support BBVA, Azteca, and custom CSV formats
- Preview mapped data before import
- Validate required fields and data types
- Handle different date formats and currencies
- Show import progress and detailed results

### Step 2: Export System (1,000 lines)
- Create export dialog with format options (CSV/Excel)
- Export current filtered/sorted view
- Include metadata (filters, export date, record count)
- Support field selection
- Generate Excel files with formatting

### Step 3: Toast Notification System (800 lines)
- Create toast notification component
- Implement notification manager
- Add notifications to all CRUD operations
- Success, error, warning, and info types
- Auto-dismiss with manual close option
- Stack multiple notifications

### Step 4: Smart Category Suggestions (1,200 lines)
- Analyze transaction history for patterns
- Suggest categories based on description keywords
- Machine learning approach for better suggestions
- Show suggestions in transaction forms
- Learn from user corrections
- Cache suggestions for performance

### Step 5: Integration & Polish (500 lines)
- Integrate all components seamlessly
- Add loading states and error handling
- Ensure mobile responsiveness
- Test all features together
- Update documentation

## Key Files to Know
- `docs/IMPLEMENTATION_PLAN.md` - Complete roadmap
- `IMPLEMENTATION_SUMMARY.md` - Current project status
- `src/components/CSVImport.jsx` - Existing CSV import component
- `src/utils/csvParser.js` - CSV parsing utilities
- `samples/` - Sample CSV files for testing
- `functions/api/upload.js` - File upload API

## Session Guidelines

### **Session Length:** 50 minutes maximum
### **Code Output:** 5,000+ lines of production-ready code
### **Documentation:** Update `IMPLEMENTATION_SUMMARY.md` after completion

## Development Commands
```bash
# Local development
npm run dev

# Build for production
npm run build

# Test with Cloudflare backend
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788

# Run tests
./scripts/test-production.sh https://avanta-finance.pages.dev
```

## Success Criteria
- ✅ Column mapping interface with drag-and-drop
- ✅ CSV import with mapping and validation
- ✅ Export current view to CSV/Excel with metadata
- ✅ Toast notifications for all actions
- ✅ Smart category suggestions based on history
- ✅ Support for Mexican bank CSV formats
- ✅ Mobile-responsive design
- ✅ Comprehensive error handling
- ✅ Performance optimization
- ✅ Complete documentation

## Testing Checklist
1. **CSV Import with Mapping:**
   - Upload BBVA CSV and map columns
   - Upload Azteca CSV and map columns
   - Test custom CSV format
   - Verify data accuracy and validation

2. **Export Functionality:**
   - Export filtered transactions as CSV
   - Export filtered transactions as Excel
   - Verify metadata inclusion
   - Test with different filter combinations

3. **Toast Notifications:**
   - Test success notifications
   - Test error notifications
   - Test multiple notifications
   - Test auto-dismiss functionality

4. **Smart Suggestions:**
   - Test category suggestions
   - Verify learning from corrections
   - Test performance with large datasets
   - Verify suggestion accuracy

## Sample CSV Formats to Support

### BBVA Format:
```csv
Fecha,Concepto,Referencia,Importe,Saldo
2025-10-01,TRANSFERENCIA RECIBIDA,1234567890,15000.00,50000.00
2025-10-02,COMPRA TARJETA,9876543210,-2500.00,47500.00
```

### Azteca Format:
```csv
Fecha,Movimiento,Descripcion,Monto,Saldo
01/10/2025,ABONO,VENTA SERVICIOS,15000,50000
02/10/2025,CARGO,COMPRA EQUIPO,-2500,47500
```

## Smart Suggestions Algorithm
- Analyze description keywords
- Match with existing category patterns
- Consider transaction amount ranges
- Learn from user corrections
- Cache results for performance
- Suggest confidence scores

## Toast Notification Types
- **Success:** Green - Operation completed successfully
- **Error:** Red - Operation failed with error message
- **Warning:** Yellow - Potential issues or confirmations
- **Info:** Blue - General information or tips

## Next Steps After This Session
- **Phase 1:** Advanced transaction classification (business/personal/transfer)
- **Phase 2:** Fiscal module and reconciliation
- **Phase 3:** Automation and accounts receivable/payable

## Important Notes
- **Comprehensive Implementation** - This session completes Phase 0
- **User Experience Focus** - Make all features intuitive and fast
- **Performance** - Handle large datasets efficiently
- **Error Handling** - Provide clear, helpful error messages
- **Mobile First** - Ensure all features work on mobile
- **Documentation** - Update all relevant documentation

## Previous Session Context
The previous session completed Phase 0, Section 3 with:
- ✅ Account CRUD operations
- ✅ Category CRUD operations
- ✅ Filter persistence
- ✅ Database schema updates
- ✅ New navigation pages

**Ready to complete Phase 0 with advanced features! 🚀**

## Session Scope Summary
- **4 Major Features** in one session
- **4 New Components** to create
- **6 Existing Components** to enhance
- **2 Backend APIs** to extend
- **2 New Utilities** to create
- **5,000+ Lines** of code expected
- **Complete Phase 0** implementation