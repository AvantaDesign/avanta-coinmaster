# Documentation Archive

This archive contains all historical documentation from the Avanta Finance project development. The documentation is organized into logical categories for easy navigation and reference.

## 📁 Directory Structure

```
archive/
├── agent-prompts/          # AI agent session prompts and instructions
├── domain-knowledge/       # Mexican tax regulations and SAT requirements
├── fixes-and-audits/       # Bug fixes, security audits, and troubleshooting
├── guides/                 # Comprehensive guides (API, deployment, testing, etc.)
├── implementation-plans/   # All implementation plans organized by version
│   ├── early/              # Pre-V4 plans (Phases 0-4)
│   ├── v4/                 # Phases 5-9 (Core Functionality)
│   ├── v5/                 # Phases 10-16 (Advanced Features)
│   ├── v6/                 # Foundation Features consolidation
│   ├── v7/                 # Phases 17-29 (Fiscal Compliance)
│   └── v8/                 # Phases 30-39 (Hardening & Polish)
├── phases/                 # Phase-specific documentation
│   ├── phases-00-04/       # Foundation phases (Security, Classification, Debts)
│   ├── phases-05-16/       # Core features (Transactions, Accounts, Dashboard)
│   ├── phases-17-29/       # Fiscal compliance (ISR/IVA, CFDI, Reconciliation)
│   └── phases-30-39/       # Hardening (Infrastructure, Security, Performance)
├── project-milestones/     # Project completion summaries and session documentation
└── research/               # Technology research and feasibility studies
```

## 🎯 Quick Navigation

### Looking for Implementation Plans?
→ Go to `implementation-plans/` directory
- For early plans (Phases 0-4): `implementation-plans/early/`
- For specific versions: `implementation-plans/v4/` through `implementation-plans/v8/`

### Looking for Phase Documentation?
→ Go to `phases/` directory
- Foundation (0-4): `phases/phases-00-04/`
- Core features (5-16): `phases/phases-05-16/`
- Fiscal compliance (17-29): `phases/phases-17-29/`
- Hardening (30-39): `phases/phases-30-39/`

### Looking for Technical Guides?
→ Go to `guides/` directory
- API documentation: `guides/API_*.md`
- Deployment guides: `guides/*_DEPLOYMENT_*.md`
- Testing guides: `guides/*_TESTING_*.md`
- Database guides: `guides/D1_*.md`
- Storage guides: `guides/R2_*.md`

### Looking for Domain Knowledge?
→ Go to `domain-knowledge/` directory
- Mexican tax regulations
- SAT requirements
- Deductibility rules

### Looking for Bug Fixes or Audits?
→ Go to `fixes-and-audits/` directory
- Security audits
- Deployment fixes
- Mobile/UI fixes
- Authentication fixes

## 📚 What's in Each Directory

### agent-prompts/
Instructions and prompts used to guide AI agents (like Gemini) across development sessions. Shows the evolution of agent instructions from V1 to V4.

### domain-knowledge/
Essential reference material about Mexican tax regulations, SAT requirements, and fiscal compliance rules that informed the design of Avanta Finance.

### fixes-and-audits/
Historical bug fixes, security audits, accessibility audits, and deployment troubleshooting documentation.

### guides/
Comprehensive technical guides including:
- API architecture and documentation
- Deployment procedures
- Testing strategies
- Database setup and management
- Storage configuration
- Integration guides
- Production monitoring

### implementation-plans/
All implementation plans organized by version. Each plan covers multiple phases and represents a major development iteration.

**Version Overview:**
- **Early** - Phases 0-4: Foundation, security, and initial features
- **V4** - Phases 5-9: Core functionality (transactions, accounts, categories)
- **V5** - Phases 10-16: Advanced features (budgeting, projections, reports)
- **V6** - Foundation features consolidation
- **V7** - Phases 17-29: Complete fiscal compliance (ISR/IVA, CFDI, reconciliation)
- **V8** - Phases 30-39: Infrastructure hardening, security, performance, polish

### phases/
Detailed documentation for each implementation phase, organized by phase ranges. Each phase typically includes:
- Implementation guides
- API references
- Testing documentation
- Visual summaries
- Completion reports

### project-milestones/
Major project milestones, completion summaries, and development session documentation showing the project's progress over time.

### research/
Technology research documents including evaluations of tools, services, and approaches considered for various features.

## 🔍 Finding Specific Information

| Looking for... | Go to... |
|---|---|
| How a specific phase was implemented | `phases/phases-XX-YY/PHASE_N_*.md` |
| API endpoints and documentation | `guides/API_*.md` |
| Testing procedures | `guides/*_TESTING_*.md` |
| Deployment steps | `guides/PRODUCTION_*.md`, `guides/*_DEPLOYMENT_*.md` |
| Security audit results | `fixes-and-audits/SECURITY_AUDIT_REPORT.md` |
| Tax regulation details | `domain-knowledge/` |
| Project completion status | `project-milestones/PROJECT_*.md` |
| Agent instructions history | `agent-prompts/NEXT_AGENT_SESSION_PROMPT_V*.md` |

## 📖 Using This Archive

### For New Developers
1. Start with `project-milestones/` to understand the project journey
2. Review `implementation-plans/` to see the overall development strategy
3. Explore `phases/` to understand specific features
4. Reference `guides/` for technical details

### For Maintenance
1. Check `fixes-and-audits/` for previous issues and solutions
2. Review `guides/` for deployment and monitoring procedures
3. Reference `domain-knowledge/` for business rules

### For Feature Development
1. Review relevant `phases/` documentation to understand existing implementations
2. Check `research/` for previous technology evaluations
3. Follow patterns from `implementation-plans/`

### For Documentation
1. See `agent-prompts/` for documentation evolution
2. Use existing phase documentation as templates
3. Follow the structure in `implementation-plans/`

## 🚫 Archive Guidelines

### This is a READ-ONLY archive
- ✅ Reference these documents
- ✅ Learn from past implementations
- ✅ Use as templates for new documentation
- ❌ Do NOT modify archived documents
- ❌ Do NOT add new content to old phases
- ❌ Do NOT move files out of the archive

### For New Documentation
When creating new documentation:
1. Create new files in the appropriate active location (root or `docs/`)
2. Follow the patterns from archived documentation
3. Archive the documentation only when the work is complete
4. Update `PHASES_INDEX.md` and `IMPLEMENTATION_ROADMAP.md` accordingly

## 📝 Archive Maintenance

### When to Archive
- After completing an implementation plan
- When starting a new implementation plan version
- After deploying features to production
- When documentation is finalized

### How to Archive
1. Move completed implementation plans to `implementation-plans/vN/`
2. Move completed phase docs to `phases/phases-XX-YY/`
3. Move completed guides to `guides/`
4. Update all README files
5. Update `PHASES_INDEX.md` in the root directory

## 🔗 Related Documentation

### Active Documentation
- **PHASES_INDEX.md** (root) - Master index of all phases
- **IMPLEMENTATION_ROADMAP.md** (root) - Guide for future development
- **GEMINI.md** (root) - Current AI agent instructions
- **docs/** - Active development documentation

### Archive Organization
Each subdirectory has its own README file with detailed information about its contents. See:
- `agent-prompts/README.md`
- `domain-knowledge/README.md`
- `fixes-and-audits/README.md`
- `guides/README.md`
- `implementation-plans/README.md` and subdirectory READMEs
- `phases/README.md` and subdirectory READMEs
- `project-milestones/README.md`
- `research/README.md`

---

**Archive Created:** October 20, 2025  
**Purpose:** Preserve and organize all historical project documentation  
**Status:** Organized and indexed for easy reference  
**Maintained By:** Development Team

**Total Documentation:** 100+ files across 39 phases of development
