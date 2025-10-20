# Quick Reference: Finding Documentation

This is a quick reference guide for finding specific types of documentation in the Avanta Finance repository.

## 🔍 Quick Find

### Looking for Implementation Plans?
```bash
# All implementation plans
docs/archive/implementation-plans/

# Specific version
docs/archive/implementation-plans/v7/IMPLEMENTATION_PLAN_V7.md
docs/archive/implementation-plans/v8/IMPLEMENTATION_PLAN_V8.md
```

### Looking for Phase Documentation?
```bash
# Find a specific phase (example: Phase 31)
docs/archive/phases/phases-30-39/PHASE_31_*.md

# All phases in a range
docs/archive/phases/phases-00-04/    # Phases 0-4
docs/archive/phases/phases-05-16/    # Phases 5-16
docs/archive/phases/phases-17-29/    # Phases 17-29
docs/archive/phases/phases-30-39/    # Phases 30-39
```

### Looking for API Documentation?
```bash
docs/archive/guides/API_DOCUMENTATION.md
docs/archive/guides/API_ARCHITECTURE.md
```

### Looking for Testing Documentation?
```bash
docs/TESTING.md                                    # Active testing guide
docs/TESTING_GUIDE.md                              # Comprehensive guide
docs/TESTING_PLAN.md                               # Testing strategy
docs/archive/guides/D1_TESTING_GUIDE.md            # D1 database testing
docs/archive/guides/CSV_CFDI_TESTING_GUIDE.md      # CSV/CFDI testing
```

### Looking for Deployment Documentation?
```bash
docs/DEPLOYMENT.md                                          # Active deployment guide
docs/archive/guides/PRODUCTION_DEPLOYMENT_GUIDE.md          # Production deployment
docs/archive/guides/PRODUCTION_READINESS_CHECKLIST.md       # Pre-deployment checklist
docs/archive/guides/PRODUCTION_MONITORING_DASHBOARD.md      # Monitoring setup
```

### Looking for Security Documentation?
```bash
docs/archive/fixes-and-audits/SECURITY_AUDIT_REPORT.md
docs/archive/fixes-and-audits/SECURITY_AND_LOGIC_FIX_PLAN.md
docs/archive/fixes-and-audits/AUTHENTICATION_*.md
docs/archive/phases/phases-00-04/PHASE1_SECURITY_*.md
docs/archive/phases/phases-30-39/PHASE_31_SECURITY_GUIDE.md
```

### Looking for Mexican Tax/SAT Documentation?
```bash
docs/archive/domain-knowledge/REQUISITOS\ SAT.md
docs/archive/domain-knowledge/REGLAS\ ST\ OCT\ 2025.md
docs/archive/domain-knowledge/GUIA_DEDUCIBILIDAD_GRANULAR.md
```

### Looking for Database (D1) Documentation?
```bash
docs/archive/guides/D1_QUICK_REFERENCE.md
docs/archive/guides/D1_TESTING_GUIDE.md
docs/archive/guides/LOCAL_DEV_WITH_D1.md
docs/archive/project-milestones/D1_SESSION_SUMMARY.md
```

### Looking for Storage (R2) Documentation?
```bash
docs/archive/guides/R2_SETUP_GUIDE.md
docs/archive/project-milestones/R2_SESSION_SUMMARY.md
```

### Looking for Project Status?
```bash
README.md                                                      # Current project overview
PHASES_INDEX.md                                                # Master index of all phases
docs/archive/project-milestones/PROJECT_100_PERCENT_COMPLETE.md
docs/archive/project-milestones/PROJECT_COMPLETION_FINAL.md
```

### Looking for Development Guides?
```bash
docs/DEVELOPMENT.md                              # Active development guide
docs/QUICKSTART.md                               # Quick start guide
docs/CONTRIBUTING.md                             # Contribution guidelines
docs/archive/guides/BACKEND_INTEGRATION_GUIDE.md
docs/archive/guides/LOCAL_TESTING.md
```

### Looking for User Documentation?
```bash
docs/USER_GUIDE.md                    # Active user guide
docs/archive/guides/USER_MANUAL.md    # Archived user manual
```

## 📂 Directory Reference

| Documentation Type | Location |
|---|---|
| **Active Docs (Root)** | `README.md`, `GEMINI.md`, `PHASES_INDEX.md`, `IMPLEMENTATION_ROADMAP.md` |
| **Active Docs (docs/)** | `docs/*.md` (13 core files) |
| **Implementation Plans** | `docs/archive/implementation-plans/` |
| **Phase Documentation** | `docs/archive/phases/` |
| **Technical Guides** | `docs/archive/guides/` |
| **Domain Knowledge** | `docs/archive/domain-knowledge/` |
| **Fixes & Audits** | `docs/archive/fixes-and-audits/` |
| **Agent Prompts** | `docs/archive/agent-prompts/` |
| **Project Milestones** | `docs/archive/project-milestones/` |
| **Research** | `docs/archive/research/` |

## 🔎 Search Commands

### Find all files mentioning a specific phase
```bash
find docs/archive/phases -name "*PHASE_31*"
```

### Search for specific content
```bash
grep -r "ISR calculation" docs/archive/
```

### List all implementation plans
```bash
find docs/archive/implementation-plans -name "IMPLEMENTATION_PLAN*.md"
```

### Find all API-related documents
```bash
find docs/archive -name "*API*.md"
```

### Find all security-related documents
```bash
find docs/archive -name "*SECURITY*.md"
find docs/archive -name "*AUDIT*.md"
```

## 📋 Common Tasks

### Starting New Implementation Plan (V9)
1. Review `PHASES_INDEX.md` for last completed phase
2. Read `IMPLEMENTATION_ROADMAP.md` for guidance
3. Create `IMPLEMENTATION_PLAN_V9.md` in root
4. Define phases 40+ based on roadmap suggestions

### Finding Phase Implementation Details
1. Check `PHASES_INDEX.md` to determine phase range
2. Navigate to appropriate `docs/archive/phases/phases-XX-YY/`
3. Look for `PHASE_N_IMPLEMENTATION_*.md` files

### Understanding Past Decisions
1. Check implementation plan in `implementation-plans/vN/`
2. Review phase summaries in `phases/phases-XX-YY/`
3. Read completion summaries for context

### Finding Examples for New Features
1. Search similar features in `phases/` directories
2. Review implementation guides
3. Check API documentation in `guides/`

## 🆘 Need More Help?

- **Complete navigation guide**: `docs/archive/README.md`
- **Detailed organization summary**: `docs/ARCHIVE_ORGANIZATION_SUMMARY.md`
- **Active documentation index**: `docs/README.md`
- **Implementation roadmap**: `IMPLEMENTATION_ROADMAP.md`
- **Master phases index**: `PHASES_INDEX.md`

## 💡 Tips

1. **Each directory has a README** - Start there for an overview
2. **Use grep for content search** - Fast way to find specific information
3. **Check PHASES_INDEX.md first** - It's the master reference
4. **Implementation plans follow versions** - V4 through V8, with early plans too
5. **Phase docs grouped by ranges** - Makes it easy to find related work

---

**Last Updated:** October 20, 2025  
**Purpose:** Quick reference for finding documentation  
**Related:** `docs/archive/README.md`, `docs/ARCHIVE_ORGANIZATION_SUMMARY.md`
