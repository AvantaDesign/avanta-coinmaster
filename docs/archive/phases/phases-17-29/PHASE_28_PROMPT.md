# Phase 28: Intelligent Compliance Engine

## Project Context
You are working on the Avanta Finance application, a comprehensive financial management system built with React, Vite, and Cloudflare Workers. The project is located at the repository root.

## Implementation Plan Reference
**CRITICAL**: Always refer to the master implementation plan at `IMPLEMENTATION_PLAN_V7.md` for complete project context and progress tracking. This file contains:

- ✅ **Phases 1-27: COMPLETED** (Comprehensive financial management system including:)
  - Phase 1-16: Core financial management, tax logic, and deductibility
  - Phase 17: Income Module & Fiscal Foundations
  - Phase 18: CFDI Control & Validation Module
  - Phase 19: Core Tax Calculation Engine (ISR/IVA)
  - Phase 20: Bank Reconciliation
  - Phase 21: Advanced Declarations (DIOT & Contabilidad Electrónica)
  - Phase 22: Annual Declaration & Advanced Analytics
  - Phase 23: Digital Archive & Compliance
  - Phase 24: System-Wide Verification & Documentation
  - Phase 25: UI/UX Polish & Bug Fixes
  - Phase 26: Core Functionality Integration
  - **Phase 27: Advanced Usability Enhancements ✅ COMPLETED**

- 🚧 **Phase 28: CURRENT PHASE** (Intelligent Compliance Engine)
- 📋 **Phase 29**: Future phase

**IMPORTANT**: You must update the `IMPLEMENTATION_PLAN_V7.md` file with your progress as you complete each task.

## Context from Previous Phase

Phase 27 successfully implemented:
- ✅ Complete polymorphic tags system with database, API, and UI
- ✅ Inline category/tag creation through SelectWithCreate component
- ✅ TagManager interface with statistics and analytics
- ✅ TagInput component for entity tagging with autocomplete
- ✅ Integration in transaction and budget forms
- ✅ Professional dark mode support and responsive design

The system now has flexible data organization and streamlined workflows, providing a solid foundation for intelligent compliance features.

## Current Task: Phase 28 - Intelligent Compliance Engine

### Goal
Design and build a backend rules engine that automatically infers and sets fiscal metadata on transactions based on user input, guiding the user to stay compliant with SAT rules. Transform the system from manual data entry to intelligent, guided compliance.

### Context from REQUISITOS SAT.md
The system must comply with Mexican fiscal regulations including:
- CFDI requirements for expense deductibility
- Cash payment limits (under $2,000 MXN)
- IVA accreditation rules based on invoice availability
- ISR deduction rules with granular controls
- Foreign client service regulations
- Payment method requirements (PUE/PPD)
- Client type classifications (national/foreign)

### Actionable Steps

#### 1. Rule Definition System

**Backend Infrastructure:**
- Design a flexible rule definition format (JSON-based)
- Create a `fiscal_rules` table to store configurable rules
- Support rule types:
  - Validation rules (required fields, format checks)
  - Inference rules (auto-set fiscal attributes)
  - Warning rules (compliance alerts)
  - Calculation rules (derived values)

**Database Schema:**
```sql
CREATE TABLE fiscal_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,  -- NULL for system-wide rules
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK(rule_type IN ('validation', 'inference', 'warning', 'calculation')),
  entity_type TEXT NOT NULL,  -- 'transaction', 'invoice', etc.
  conditions TEXT NOT NULL,  -- JSON conditions
  actions TEXT NOT NULL,  -- JSON actions to take
  priority INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Rule Configuration Files:**
- Create `functions/rules/sat-compliance-rules.json` with key rules:
  - CFDI requirement rules
  - Cash payment limit rules
  - IVA accreditation rules
  - ISR deductibility rules
  - Foreign client rules
  - Payment method rules

**Example Rule Structure:**
```json
{
  "rule_id": "cfdi_required_for_deductibility",
  "rule_type": "inference",
  "entity_type": "transaction",
  "conditions": {
    "all": [
      { "field": "type", "operator": "equals", "value": "gasto" },
      { "field": "amount", "operator": "greater_than", "value": 2000 }
    ]
  },
  "actions": [
    {
      "type": "require_field",
      "field": "cfdi_uuid",
      "message": "Se requiere CFDI para gastos mayores a $2,000 MXN"
    },
    {
      "type": "set_if_missing",
      "field": "is_isr_deductible",
      "value": false,
      "reason": "No CFDI provided"
    }
  ]
}
```

#### 2. Rules Engine Implementation

**Backend Service:**
- Create `functions/services/rules-engine.js` with:
  - `loadRules()` - Load and cache rule definitions
  - `evaluateRules(entity, context)` - Evaluate all applicable rules
  - `applyActions(entity, actions)` - Apply rule actions
  - `validateEntity(entity)` - Run validation rules
  - `inferMetadata(entity)` - Auto-set fiscal attributes
  - `generateWarnings(entity)` - Create compliance warnings

**Rule Evaluation Logic:**
```javascript
class RulesEngine {
  async evaluateTransaction(transaction, context = {}) {
    const applicableRules = this.getApplicableRules('transaction', transaction);
    const results = {
      inferences: [],
      validations: [],
      warnings: [],
      calculations: []
    };
    
    for (const rule of applicableRules) {
      if (this.evaluateConditions(rule.conditions, transaction, context)) {
        const actionResults = await this.applyActions(rule.actions, transaction, context);
        results[rule.rule_type + 's'].push(actionResults);
      }
    }
    
    return results;
  }
  
  evaluateConditions(conditions, entity, context) {
    // Support AND/OR logic with nested conditions
    // Support operators: equals, not_equals, greater_than, less_than, contains, regex, etc.
  }
  
  async applyActions(actions, entity, context) {
    // Support action types:
    // - set_field: Auto-populate field
    // - require_field: Mark field as required
    // - warn: Generate warning message
    // - block: Prevent save with error
    // - calculate: Compute derived value
  }
}
```

**API Integration:**
- Update `functions/api/transactions.js`:
  - Call rules engine before saving transactions
  - Return inference results to frontend
  - Apply automatic field population
  - Return warnings and validation errors

**Endpoint Enhancement:**
```javascript
POST /api/transactions
{
  // Original transaction data
  "date": "2025-10-19",
  "amount": 5000,
  "type": "gasto",
  "description": "Equipo de oficina",
  
  // Rules engine will infer:
  // - cfdi_required: true
  // - is_isr_deductible: false (if no CFDI)
  // - warnings: ["Se requiere CFDI para deducir este gasto"]
}

Response:
{
  "success": true,
  "transaction": { ... },
  "rules_applied": {
    "inferences": [
      {
        "field": "is_isr_deductible",
        "value": false,
        "reason": "Gasto mayor a $2,000 sin CFDI"
      }
    ],
    "warnings": [
      "Se requiere CFDI para deducir este gasto de ISR"
    ],
    "validations": []
  }
}
```

#### 3. Frontend Guided Input

**Enhanced Transaction Form:**
- Update `AddTransaction.jsx` to be more interactive:
  - Ask clarifying questions based on context
  - Display real-time compliance status
  - Show inferred fiscal attributes
  - Provide contextual help and guidance

**Interactive Question Flow:**
```javascript
// Example guided questions:
if (amount > 2000 && type === 'gasto') {
  showQuestion({
    question: "¿Cuentas con factura (CFDI) para este gasto?",
    options: [
      { 
        value: "yes", 
        label: "Sí, tengo CFDI",
        nextAction: "request_cfdi_uuid"
      },
      { 
        value: "no", 
        label: "No, no tengo CFDI",
        inference: { is_isr_deductible: false, is_iva_deductible: false },
        warning: "Este gasto NO será deducible de ISR ni acreditable de IVA"
      }
    ]
  });
}
```

**Real-time Compliance Display:**
- Create `ComplianceStatus.jsx` component:
  - Visual indicators (✅ ⚠️ ❌)
  - Compliance score
  - List of requirements met/pending
  - Actionable recommendations

**Example Compliance Display:**
```jsx
<ComplianceStatus transaction={formData}>
  <ComplianceItem
    icon={hasCFDI ? "✅" : "⚠️"}
    status={hasCFDI ? "compliant" : "warning"}
    title="Requisito CFDI"
    message={
      hasCFDI 
        ? "CFDI vinculado correctamente" 
        : "Se requiere CFDI para gastos mayores a $2,000 MXN"
    }
  />
  <ComplianceItem
    icon={isDeductible ? "✅" : "ℹ️"}
    status={isDeductible ? "compliant" : "info"}
    title="Deducibilidad ISR"
    message={isDeductible ? "Deducible de ISR" : "No deducible de ISR"}
  />
</ComplianceStatus>
```

**Contextual Help:**
- Add help tooltips with SAT regulations
- Link to relevant documentation
- Provide examples and use cases
- Show calculation explanations

#### 4. Advanced Rules Features

**Rule Management Interface:**
- Create `RulesManager.jsx` component:
  - View system rules
  - Create custom rules (admin users)
  - Enable/disable rules
  - Test rules against sample data
  - View rule execution logs

**Rule Testing:**
- Create `functions/api/rules-test.js`:
  - Test rules against sample transactions
  - Simulate rule outcomes
  - Debug rule conditions
  - Performance profiling

**Rule Analytics:**
- Track rule execution frequency
- Monitor rule effectiveness
- Identify frequently triggered warnings
- Optimize rule performance

**Rule Versioning:**
- Track rule changes over time
- Support rule effective dates
- Handle rule migrations
- Audit rule modifications

#### 5. Integration Points

**Transaction Validation:**
- Run rules engine on transaction creation
- Run rules engine on transaction updates
- Provide preview before saving
- Allow override with confirmation

**Bulk Import:**
- Apply rules to imported transactions
- Generate compliance report
- Fix common issues automatically
- Flag problematic transactions

**CFDI Linking:**
- Auto-link CFDI when rules infer requirement
- Validate CFDI matches transaction
- Update deductibility when CFDI linked
- Generate alerts for missing CFDIs

**Tax Calculations:**
- Use rule inferences in tax calculations
- Validate deductibility flags
- Apply rules to historical data
- Generate compliance reports

### Verification Steps

1. **Database Setup:**
   - Run migration to create fiscal_rules table
   - Load initial SAT compliance rules
   - Verify rules are stored correctly

2. **Rules Engine Testing:**
   - Test rule evaluation logic
   - Test condition matching (AND/OR logic)
   - Test action application
   - Test rule priority handling

3. **API Integration:**
   - Test rules engine in transaction API
   - Verify inferences are returned
   - Test validation errors
   - Test warning generation

4. **Frontend Integration:**
   - Test guided input flow
   - Verify real-time compliance display
   - Test question-based data entry
   - Verify inferred fields are populated

5. **End-to-End Scenarios:**
   - Test common transaction scenarios
   - Test edge cases
   - Test rule conflicts
   - Test performance with multiple rules

6. **Build and Deploy:**
   - Run `npm run build` to ensure compilation
   - Test in development environment
   - Verify no breaking changes
   - Monitor performance impact

### Progress Tracking

**MANDATORY**: Update `IMPLEMENTATION_PLAN_V7.md` with checkmarks (✅) as you complete each task:
- [ ] Create fiscal_rules database table
- [ ] Design rule definition format
- [ ] Create SAT compliance rules JSON
- [ ] Implement RulesEngine service
- [ ] Integrate with transaction API
- [ ] Update AddTransaction with guided input
- [ ] Create ComplianceStatus component
- [ ] Add real-time compliance feedback
- [ ] Test all rule scenarios
- [ ] Create rules management interface (optional)
- [ ] Document rule system

**MANDATORY**: Create completion summary `PHASE_28_INTELLIGENT_COMPLIANCE_SUMMARY.md` when finished.

### Technical Considerations

**Performance:**
- Cache compiled rules for efficiency
- Use lazy evaluation where possible
- Optimize condition checking
- Profile rule execution time
- Consider async rule evaluation

**Maintainability:**
- Use clear rule naming conventions
- Document rule logic thoroughly
- Provide rule examples
- Keep rules simple and focused
- Avoid rule conflicts

**Extensibility:**
- Support custom user rules
- Allow rule plugins
- Enable/disable rules dynamically
- Support rule parameters
- Version control for rules

**User Experience:**
- Non-intrusive guidance
- Clear, actionable messages
- Progressive disclosure
- Keyboard accessibility
- Mobile-friendly interface

**Testing:**
- Unit tests for rule evaluation
- Integration tests for API
- E2E tests for guided input
- Performance tests for rule engine
- Test with real-world scenarios

### Security Considerations

- Validate rule definitions
- Prevent rule injection attacks
- Limit rule complexity
- Audit rule execution
- Protect sensitive rule data
- Rate limit rule evaluation

### Database Considerations

- Index rules by entity_type
- Cache frequently used rules
- Monitor rule table size
- Archive old rule versions
- Optimize rule queries

### Integration Points

- Connect with existing transaction system
- Use existing validation utilities
- Integrate with tax calculation engine
- Connect with CFDI management
- Use existing fiscal parameters
- Prepare foundation for Phase 29

## Next Step

Upon successful completion and verification of all Phase 28 tasks, generate and output the complete, self-contained prompt for **Phase 29: System-Wide Connectivity & Rules Verification**, following this same instructional format and referencing the updated implementation plan.

## Example Implementation Flow

1. **Day 1**: Database schema, rule definitions, basic rules engine
2. **Day 2**: API integration, transaction validation, inference logic
3. **Day 3**: Frontend guided input, compliance display, real-time feedback
4. **Day 4**: Testing, optimization, documentation, completion summary

## Success Criteria

- ✅ Rules engine evaluates transactions correctly
- ✅ Fiscal metadata is automatically inferred
- ✅ Users receive clear, actionable guidance
- ✅ Compliance status is displayed in real-time
- ✅ System prevents non-compliant transactions (with overrides)
- ✅ All builds pass without errors
- ✅ Performance is acceptable (< 100ms per transaction)
- ✅ Documentation is complete

## Resources

- **REQUISITOS SAT.md**: Mexican fiscal regulations reference
- **IMPLEMENTATION_PLAN_V7.md**: Master implementation plan
- **Phase 27 Summary**: Recent usability enhancements context
- **src/utils/fiscalCalculations.js**: Existing fiscal logic
- **functions/api/transactions.js**: Transaction API to enhance

---

**Note**: This is an advanced feature that will significantly improve user experience and compliance. Focus on creating a robust, extensible system that can grow with changing regulations and user needs.
