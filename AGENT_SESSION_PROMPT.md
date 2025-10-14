# 🤖 GitHub Copilot Agent Session Prompt - Avanta CoinMaster 2.0

## Project Context
You are working on **Avanta CoinMaster 2.0**, a financial management application for Personas Físicas con Actividad Empresarial (PFAE) in Mexico. The current application is a basic transaction aggregator, and we're transforming it into an intelligent financial assistant.

## Current Status
- ✅ **Production Ready:** React frontend + Cloudflare Workers backend + D1 database + R2 storage
- ✅ **Deployed:** Live at Cloudflare Pages with full functionality
- ✅ **Documentation:** Complete docs in `/docs` folder, archived sessions in `/docs/archive`
- ✅ **Testing:** Comprehensive test scripts in `/scripts` folder

## Implementation Plan
Follow the detailed plan in `docs/IMPLEMENTATION_PLAN.md`. The plan is divided into phases:

### **Phase 0: Usability & Flow Improvements** (START HERE)
- Table interactions (filtering, search, editing, bulk operations)
- Data visualization improvements (account breakdowns, period controls, colors)
- Account & category management (CRUD operations)
- Enhanced CSV import/export with column mapping
- Smart notifications and category suggestions

### **Phase 1: Advanced Transaction Classification**
- Update database schema for business/personal/transfer types
- Extend API for new transaction fields
- Link transactions to invoices/CFDIs
- Soft delete functionality

### **Phase 2: Fiscal Module & Reconciliation**
- Tax estimation and calculation
- Account reconciliation features

### **Phase 3: Automation & Accounts Receivable/Payable**
- Reduce manual work
- Invoice status tracking

### **Phase 4: Advanced Analytics & UX**
- High-value insights
- Enhanced user experience

## Session Guidelines

### **Session Length:** 45-60 minutes maximum
### **Code Output:** Complete, production-ready code
### **Documentation:** Update `IMPLEMENTATION_SUMMARY.md` after each session

## Current Tech Stack
- **Frontend:** React 18 + Tailwind CSS (`/src`)
- **Backend:** Cloudflare Workers Functions (`/functions`)
- **Database:** Cloudflare D1 SQLite (`schema.sql`)
- **Storage:** Cloudflare R2 (`/samples`)
- **Deployment:** Cloudflare Pages

## Key Files to Know
- `docs/IMPLEMENTATION_PLAN.md` - Your implementation roadmap
- `IMPLEMENTATION_SUMMARY.md` - Current project status
- `schema.sql` - Database schema (needs updates for Phase 1)
- `functions/api/transactions.js` - Main API endpoints
- `src/pages/Transactions.jsx` - Main transactions page
- `src/components/TransactionTable.jsx` - Transaction display component

## Session Instructions

1. **Read the implementation plan** in `docs/IMPLEMENTATION_PLAN.md`
2. **Start with Phase 0** - Focus on usability improvements first
3. **Implement complete features** - Don't leave partial implementations
4. **Test thoroughly** - Use scripts in `/scripts` folder
5. **Update documentation** - Keep `IMPLEMENTATION_SUMMARY.md` current
6. **Commit frequently** - Small, focused commits with clear messages

## Development Commands
```bash
# Local development
npm run dev

# Build for production
npm run build

# Test production locally
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788

# Run tests
./scripts/test-production.sh https://avanta-finance.pages.dev
```

## Success Criteria
- ✅ Feature works in production
- ✅ Code is clean and maintainable
- ✅ Documentation is updated
- ✅ Tests pass
- ✅ No breaking changes to existing functionality

## Next Steps
**Start with Phase 0, Section 1: Table Interactions**
- Implement filtering and search functionality
- Add transaction editing capabilities
- Create bulk editing features
- Add table sorting by columns

**Remember:** This is a production application. Every change should be thoroughly tested and documented. Focus on user experience and maintain code quality.

---

**Ready to transform Avanta CoinMaster into an intelligent financial assistant! 🚀**
