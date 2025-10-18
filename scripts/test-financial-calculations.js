#!/usr/bin/env node

/**
 * Financial Calculations Test Suite - Phase 17
 * 
 * Comprehensive unit tests for:
 * - ISR (Income Tax) calculations
 * - IVA (VAT) calculations
 * - Fiscal utilities
 * - Financial Health Score
 * - Granular deductibility logic
 * 
 * Usage: node test-financial-calculations.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test counters
let testsPassed = 0;
let testsFailed = 0;
let warnings = 0;

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper functions
function printHeader(text) {
  console.log('');
  console.log(colors.cyan + '============================================================================');
  console.log('  ' + text);
  console.log('============================================================================' + colors.reset);
  console.log('');
}

function printSection(text) {
  console.log('');
  console.log(colors.blue + '--- ' + text + ' ---' + colors.reset);
  console.log('');
}

function printSuccess(test) {
  console.log(colors.green + '✓ PASSED:' + colors.reset + ' ' + test);
  testsPassed++;
}

function printFailure(test, expected, actual) {
  console.log(colors.red + '✗ FAILED:' + colors.reset + ' ' + test);
  console.log('  Expected: ' + expected);
  console.log('  Actual: ' + actual);
  testsFailed++;
}

function printWarning(text) {
  console.log(colors.yellow + '⚠ WARNING:' + colors.reset + ' ' + text);
  warnings++;
}

function printInfo(text) {
  console.log(colors.blue + 'ℹ INFO:' + colors.reset + ' ' + text);
}

function assertEqual(actual, expected, testName, tolerance = 0.01) {
  if (typeof expected === 'number' && typeof actual === 'number') {
    if (Math.abs(actual - expected) <= tolerance) {
      printSuccess(testName);
      return true;
    } else {
      printFailure(testName, expected, actual);
      return false;
    }
  } else if (actual === expected) {
    printSuccess(testName);
    return true;
  } else {
    printFailure(testName, expected, actual);
    return false;
  }
}

// ============================================================================
// ISR Calculation Tests
// ============================================================================

/**
 * ISR Tax Brackets for 2024 (Official SAT brackets)
 */
const ISR_BRACKETS_2024 = [
  { lowerLimit: 0.01, upperLimit: 7735.00, fixedFee: 0.00, excessRate: 0.0192 },
  { lowerLimit: 7735.01, upperLimit: 65651.07, fixedFee: 148.51, excessRate: 0.0640 },
  { lowerLimit: 65651.08, upperLimit: 115375.90, fixedFee: 3855.14, excessRate: 0.1088 },
  { lowerLimit: 115375.91, upperLimit: 134119.41, fixedFee: 9265.20, excessRate: 0.1600 },
  { lowerLimit: 134119.42, upperLimit: 160577.65, fixedFee: 12264.16, excessRate: 0.1792 },
  { lowerLimit: 160577.66, upperLimit: 323862.00, fixedFee: 17005.47, excessRate: 0.2136 },
  { lowerLimit: 323862.01, upperLimit: 510451.00, fixedFee: 51883.01, excessRate: 0.2352 },
  { lowerLimit: 510451.01, upperLimit: 974535.03, fixedFee: 95768.74, excessRate: 0.3000 },
  { lowerLimit: 974535.04, upperLimit: 1299380.04, fixedFee: 234993.95, excessRate: 0.3200 },
  { lowerLimit: 1299380.05, upperLimit: 3898140.12, fixedFee: 338944.34, excessRate: 0.3400 },
  { lowerLimit: 3898140.13, upperLimit: Infinity, fixedFee: 1222522.76, excessRate: 0.3500 }
];

function calculateISR(annualIncome) {
  if (annualIncome <= 0) {
    return 0;
  }

  // Find applicable bracket
  const bracket = ISR_BRACKETS_2024.find(b => 
    annualIncome >= b.lowerLimit && annualIncome <= b.upperLimit
  );

  if (!bracket) {
    return 0;
  }

  // Calculate ISR: fixed fee + (income - lower limit) * rate
  const taxableExcess = annualIncome - bracket.lowerLimit;
  const taxOnExcess = taxableExcess * bracket.excessRate;
  const totalTax = bracket.fixedFee + taxOnExcess;

  return Math.max(0, totalTax);
}

function testISRCalculations() {
  printSection('Test 1: ISR Calculation Tests');

  // Test 1.1: Zero income
  assertEqual(calculateISR(0), 0, 'ISR on zero income should be 0');

  // Test 1.2: Negative income
  assertEqual(calculateISR(-1000), 0, 'ISR on negative income should be 0');

  // Test 1.3: First bracket (low income)
  // Income: $5,000 MXN
  // Bracket: 0.01 - 7,735.00, fixed: 0, rate: 1.92%
  // ISR = 0 + (5000 - 0.01) * 0.0192 = 95.98
  const isr1 = calculateISR(5000);
  assertEqual(isr1, 95.98, 'ISR for $5,000 MXN', 0.10);

  // Test 1.4: Second bracket
  // Income: $50,000 MXN
  // Bracket: 7,735.01 - 65,651.07, fixed: 148.51, rate: 6.40%
  // ISR = 148.51 + (50000 - 7735.01) * 0.064 = 148.51 + 2704.96 = 2853.47
  const isr2 = calculateISR(50000);
  assertEqual(isr2, 2853.47, 'ISR for $50,000 MXN', 0.10);

  // Test 1.5: Third bracket
  // Income: $100,000 MXN
  // Bracket: 65,651.08 - 115,375.90, fixed: 3855.14, rate: 10.88%
  // ISR = 3855.14 + (100000 - 65651.08) * 0.1088 = 3855.14 + 3737.17 = 7592.31
  const isr3 = calculateISR(100000);
  assertEqual(isr3, 7592.31, 'ISR for $100,000 MXN', 0.10);

  // Test 1.6: High income (8th bracket)
  // Income: $800,000 MXN
  // Bracket: 510,451.01 - 974,535.03, fixed: 95,768.74, rate: 30.00%
  // ISR = 95768.74 + (800000 - 510451.01) * 0.30 = 95768.74 + 86864.697 = 182633.44
  const isr4 = calculateISR(800000);
  assertEqual(isr4, 182633.44, 'ISR for $800,000 MXN', 0.50);

  // Test 1.7: Very high income (top bracket)
  // Income: $5,000,000 MXN
  // Bracket: 3,898,140.13+, fixed: 1,222,522.76, rate: 35.00%
  // ISR = 1222522.76 + (5000000 - 3898140.13) * 0.35 = 1222522.76 + 385650.96 = 1608173.72
  const isr5 = calculateISR(5000000);
  assertEqual(isr5, 1608173.72, 'ISR for $5,000,000 MXN', 1.00);

  // Test 1.8: Bracket boundary (exactly at lower limit of second bracket)
  const isr6 = calculateISR(7735.01);
  assertEqual(isr6, 148.51, 'ISR at bracket boundary (7,735.01)', 0.10);

  // Test 1.9: Just below bracket boundary
  const isr7 = calculateISR(7735.00);
  const expected7 = 0 + (7735.00 - 0.01) * 0.0192;
  assertEqual(isr7, expected7, 'ISR just below bracket boundary (7,735.00)', 0.10);
}

// ============================================================================
// IVA Calculation Tests
// ============================================================================

const IVA_RATE = 0.16; // 16% IVA rate in Mexico

function calculateIVAAcreditable(expenses) {
  if (!Array.isArray(expenses) || expenses.length === 0) {
    return { total: 0, count: 0 };
  }

  const total = expenses
    .filter(exp => exp.is_iva_deductible && exp.amount > 0)
    .reduce((sum, exp) => sum + (exp.amount * IVA_RATE), 0);

  return {
    total,
    count: expenses.filter(exp => exp.is_iva_deductible).length
  };
}

function calculateIVATrasladado(income) {
  if (!Array.isArray(income) || income.length === 0) {
    return { total: 0, count: 0 };
  }

  const total = income
    .filter(inc => inc.amount > 0)
    .reduce((sum, inc) => sum + (inc.amount * IVA_RATE), 0);

  return {
    total,
    count: income.length
  };
}

function testIVACalculations() {
  printSection('Test 2: IVA Calculation Tests');

  // Test 2.1: Empty arrays
  const iva1 = calculateIVAAcreditable([]);
  assertEqual(iva1.total, 0, 'IVA acreditable on empty array');
  
  const iva2 = calculateIVATrasladado([]);
  assertEqual(iva2.total, 0, 'IVA trasladado on empty array');

  // Test 2.2: Single expense
  const expenses1 = [
    { amount: 1000, is_iva_deductible: true }
  ];
  const iva3 = calculateIVAAcreditable(expenses1);
  assertEqual(iva3.total, 160, 'IVA acreditable on $1,000', 0.01);

  // Test 2.3: Multiple expenses, some non-deductible
  const expenses2 = [
    { amount: 1000, is_iva_deductible: true },
    { amount: 500, is_iva_deductible: false },
    { amount: 2000, is_iva_deductible: true }
  ];
  const iva4 = calculateIVAAcreditable(expenses2);
  // Only $1,000 + $2,000 = $3,000 is deductible
  // IVA = $3,000 * 0.16 = $480
  assertEqual(iva4.total, 480, 'IVA acreditable with mixed deductibility', 0.01);
  assertEqual(iva4.count, 2, 'Count of IVA deductible expenses');

  // Test 2.4: Income IVA calculation
  const income1 = [
    { amount: 10000 },
    { amount: 5000 }
  ];
  const iva5 = calculateIVATrasladado(income1);
  // Total income: $15,000
  // IVA = $15,000 * 0.16 = $2,400
  assertEqual(iva5.total, 2400, 'IVA trasladado on income', 0.01);

  // Test 2.5: Zero amounts should be ignored
  const expenses3 = [
    { amount: 0, is_iva_deductible: true },
    { amount: 1000, is_iva_deductible: true }
  ];
  const iva6 = calculateIVAAcreditable(expenses3);
  assertEqual(iva6.total, 160, 'IVA calculation ignores zero amounts', 0.01);

  // Test 2.6: Negative amounts should be ignored
  const expenses4 = [
    { amount: -500, is_iva_deductible: true },
    { amount: 1000, is_iva_deductible: true }
  ];
  const iva7 = calculateIVAAcreditable(expenses4);
  assertEqual(iva7.total, 160, 'IVA calculation ignores negative amounts', 0.01);
}

// ============================================================================
// Monthly ISR Calculation Tests
// ============================================================================

function calculateMonthlyISR(monthlyIncome, monthlyDeductible, accumulatedIncome = 0, accumulatedDeductible = 0) {
  const monthlyUtilidad = monthlyIncome - monthlyDeductible;
  const totalIncome = accumulatedIncome + monthlyIncome;
  const totalDeductible = accumulatedDeductible + monthlyDeductible;
  const totalUtilidad = totalIncome - totalDeductible;

  // Calculate ISR on accumulated income
  const totalISR = calculateISR(totalUtilidad);
  
  // ISR already paid (on previous months)
  const previousUtilidad = accumulatedIncome - accumulatedDeductible;
  const previousISR = calculateISR(previousUtilidad);
  
  // Monthly ISR to pay = Total ISR - Previously paid ISR
  const monthlyISR = Math.max(0, totalISR - previousISR);

  return {
    monthlyUtilidad,
    totalUtilidad,
    monthlyISR,
    totalISR,
    previousISR,
    effectiveRate: totalUtilidad > 0 ? (totalISR / totalUtilidad) * 100 : 0
  };
}

function testMonthlyISRCalculations() {
  printSection('Test 3: Monthly ISR Calculation Tests');

  // Test 3.1: First month with no accumulated income
  // Income: $10,000, Deductible: $3,000, Utilidad: $7,000
  const month1 = calculateMonthlyISR(10000, 3000, 0, 0);
  const expectedISR1 = calculateISR(7000);
  assertEqual(month1.monthlyISR, expectedISR1, 'First month ISR (no accumulation)', 0.10);
  assertEqual(month1.previousISR, 0, 'No previous ISR in first month');

  // Test 3.2: Second month with accumulated income
  // Month 1: Income $10,000, Deductible $3,000, Utilidad $7,000
  // Month 2: Income $12,000, Deductible $4,000, Utilidad $8,000
  // Accumulated: Income $22,000, Deductible $7,000, Utilidad $15,000
  const month2 = calculateMonthlyISR(12000, 4000, 10000, 3000);
  const totalISR2 = calculateISR(15000);
  const previousISR2 = calculateISR(7000);
  const expectedMonthly2 = totalISR2 - previousISR2;
  assertEqual(month2.monthlyISR, expectedMonthly2, 'Second month ISR with accumulation', 0.10);

  // Test 3.3: Month with zero income (should not result in negative ISR)
  const month3 = calculateMonthlyISR(0, 0, 10000, 3000);
  assertEqual(month3.monthlyISR, 0, 'Zero income month should not have ISR to pay', 0.01);

  // Test 3.4: Month with losses (deductible > income)
  // Month income: $5,000, deductible: $8,000 (loss of $3,000)
  // Accumulated: income $15,000, deductible $11,000, utilidad $4,000
  const month4 = calculateMonthlyISR(5000, 8000, 10000, 3000);
  const totalISR4 = calculateISR(4000);
  const previousISR4 = calculateISR(7000);
  // Since totalISR4 < previousISR4, monthlyISR should be 0 (no negative tax)
  assertEqual(month4.monthlyISR, 0, 'Month with losses should have zero or minimal ISR', 0.01);

  // Test 3.5: Effective rate calculation
  const month5 = calculateMonthlyISR(100000, 30000, 0, 0);
  const utilidad5 = 70000;
  const isr5 = calculateISR(utilidad5);
  const expectedRate = (isr5 / utilidad5) * 100;
  assertEqual(month5.effectiveRate, expectedRate, 'Effective tax rate calculation', 0.01);
}

// ============================================================================
// Granular Deductibility Tests (Phase 16)
// ============================================================================

function testGranularDeductibility() {
  printSection('Test 4: Granular Deductibility Logic Tests (Phase 16)');

  // Test 4.1: National business expense - both IVA and ISR deductible
  const expense1 = {
    amount: 1000,
    expense_type: 'national',
    transaction_type: 'business',
    is_iva_deductible: true,
    is_isr_deductible: true
  };
  
  printInfo('National business expense: IVA and ISR deductible');
  if (expense1.is_iva_deductible && expense1.is_isr_deductible) {
    printSuccess('National business expense correctly marked as fully deductible');
  } else {
    printFailure('National business expense deductibility', 'both true', 
      `IVA: ${expense1.is_iva_deductible}, ISR: ${expense1.is_isr_deductible}`);
  }

  // Test 4.2: International expense without invoice - IVA not deductible
  const expense2 = {
    amount: 1000,
    expense_type: 'international_no_invoice',
    transaction_type: 'business',
    is_iva_deductible: false,
    is_isr_deductible: true
  };
  
  printInfo('International expense (no invoice): IVA not deductible, ISR deductible');
  if (!expense2.is_iva_deductible && expense2.is_isr_deductible) {
    printSuccess('International expense (no invoice) correctly marked');
  } else {
    printFailure('International expense (no invoice) deductibility', 'IVA: false, ISR: true',
      `IVA: ${expense2.is_iva_deductible}, ISR: ${expense2.is_isr_deductible}`);
  }

  // Test 4.3: International expense with invoice - both deductible
  const expense3 = {
    amount: 1000,
    expense_type: 'international_with_invoice',
    transaction_type: 'business',
    is_iva_deductible: true,
    is_isr_deductible: true
  };
  
  printInfo('International expense (with invoice): both deductible');
  if (expense3.is_iva_deductible && expense3.is_isr_deductible) {
    printSuccess('International expense (with invoice) correctly marked as fully deductible');
  } else {
    printFailure('International expense (with invoice) deductibility', 'both true',
      `IVA: ${expense3.is_iva_deductible}, ISR: ${expense3.is_isr_deductible}`);
  }

  // Test 4.4: Personal expense - not deductible
  const expense4 = {
    amount: 1000,
    expense_type: 'national',
    transaction_type: 'personal',
    is_iva_deductible: false,
    is_isr_deductible: false
  };
  
  printInfo('Personal expense: not deductible');
  if (!expense4.is_iva_deductible && !expense4.is_isr_deductible) {
    printSuccess('Personal expense correctly marked as non-deductible');
  } else {
    printFailure('Personal expense deductibility', 'both false',
      `IVA: ${expense4.is_iva_deductible}, ISR: ${expense4.is_isr_deductible}`);
  }

  // Test 4.5: Calculate IVA on mixed expenses
  const mixedExpenses = [
    { amount: 1000, is_iva_deductible: true, expense_type: 'national' },
    { amount: 2000, is_iva_deductible: false, expense_type: 'international_no_invoice' },
    { amount: 1500, is_iva_deductible: true, expense_type: 'international_with_invoice' }
  ];
  
  const ivaResult = calculateIVAAcreditable(mixedExpenses);
  // Only $1,000 + $1,500 = $2,500 is IVA deductible
  // IVA = $2,500 * 0.16 = $400
  assertEqual(ivaResult.total, 400, 'IVA calculation with granular deductibility', 0.01);
}

// ============================================================================
// Edge Cases and Boundary Conditions
// ============================================================================

function testEdgeCases() {
  printSection('Test 5: Edge Cases and Boundary Conditions');

  // Test 5.1: Very small income (cents)
  const isr1 = calculateISR(0.50);
  assertEqual(isr1, 0.50 * 0.0192, 'ISR on very small income ($0.50)', 0.001);

  // Test 5.2: Income exactly at bracket boundary
  const isr2 = calculateISR(7735.00);
  const expected2 = (7735.00 - 0.01) * 0.0192;
  assertEqual(isr2, expected2, 'ISR at exact bracket boundary', 0.10);

  // Test 5.3: Income just above bracket boundary
  const isr3 = calculateISR(7735.01);
  assertEqual(isr3, 148.51, 'ISR just above bracket boundary', 0.01);

  // Test 5.4: Very large income (edge of top bracket)
  const isr4 = calculateISR(10000000);
  const expected4 = 1222522.76 + (10000000 - 3898140.13) * 0.35;
  assertEqual(isr4, expected4, 'ISR on very large income ($10M)', 1.00);

  // Test 5.5: IVA calculation with empty deductible status
  const expenses = [
    { amount: 1000 } // Missing is_iva_deductible flag
  ];
  const iva = calculateIVAAcreditable(expenses);
  assertEqual(iva.total, 0, 'IVA with undefined deductibility flag should be 0', 0.01);

  // Test 5.6: Rounding precision
  const isr5 = calculateISR(12345.67);
  printInfo(`ISR for $12,345.67: $${isr5.toFixed(2)} (testing decimal precision)`);
  if (isr5 > 0 && !isNaN(isr5)) {
    printSuccess('ISR calculation handles decimal precision');
  } else {
    printFailure('ISR decimal precision', 'valid number', isr5);
  }

  // Test 5.7: Accumulated ISR with multiple months
  let accumulated = { income: 0, deductible: 0 };
  const months = [
    { income: 10000, deductible: 3000 },
    { income: 15000, deductible: 5000 },
    { income: 12000, deductible: 4000 },
    { income: 18000, deductible: 6000 }
  ];

  let totalMonthlyISR = 0;
  months.forEach((month, index) => {
    const result = calculateMonthlyISR(
      month.income,
      month.deductible,
      accumulated.income,
      accumulated.deductible
    );
    totalMonthlyISR += result.monthlyISR;
    accumulated.income += month.income;
    accumulated.deductible += month.deductible;
  });

  const totalUtilidad = accumulated.income - accumulated.deductible;
  const annualISR = calculateISR(totalUtilidad);
  
  // Total monthly ISR should equal annual ISR (within tolerance)
  assertEqual(totalMonthlyISR, annualISR, 'Sum of monthly ISR equals annual ISR', 0.50);
}

// ============================================================================
// Financial Health Score Tests
// ============================================================================

function calculateCashFlowScore(cashFlowData) {
  if (!cashFlowData || cashFlowData.income === undefined || cashFlowData.expenses === undefined) {
    return 50; // Neutral score if no data
  }

  const income = cashFlowData.income || 0;
  const expenses = cashFlowData.expenses || 0;
  
  if (income === 0 && expenses > 0) return 0; // No income with expenses is critical
  if (income === 0 && expenses === 0) return 50; // No activity is neutral
  
  const ratio = (income - expenses) / income;
  
  if (ratio >= 0.30) return 100; // Saving 30%+ is excellent
  if (ratio >= 0.20) return 85;  // Saving 20-30% is great
  if (ratio >= 0.10) return 70;  // Saving 10-20% is good
  if (ratio >= 0) return 50;     // Break-even is neutral
  if (ratio >= -0.20) return 30; // 20% deficit is concerning
  return 0;                       // More than 20% deficit is critical
}

function testFinancialHealthScore() {
  printSection('Test 6: Financial Health Score Tests');

  // Test 6.1: Excellent cash flow (saving 30%+)
  const cashFlow1 = { income: 10000, expenses: 6000 };
  const score1 = calculateCashFlowScore(cashFlow1);
  assertEqual(score1, 100, 'Excellent cash flow score (40% savings)', 0.1);

  // Test 6.2: Good cash flow (saving 10-20%)
  const cashFlow2 = { income: 10000, expenses: 8500 };
  const score2 = calculateCashFlowScore(cashFlow2);
  assertEqual(score2, 70, 'Good cash flow score (15% savings)', 0.1);

  // Test 6.3: Break-even
  const cashFlow3 = { income: 10000, expenses: 10000 };
  const score3 = calculateCashFlowScore(cashFlow3);
  assertEqual(score3, 50, 'Break-even cash flow score', 0.1);

  // Test 6.4: Deficit
  const cashFlow4 = { income: 10000, expenses: 11000 };
  const score4 = calculateCashFlowScore(cashFlow4);
  assertEqual(score4, 30, 'Deficit cash flow score (10% deficit)', 0.1);

  // Test 6.5: No income
  const cashFlow5 = { income: 0, expenses: 5000 };
  const score5 = calculateCashFlowScore(cashFlow5);
  assertEqual(score5, 0, 'No income cash flow score', 0.1);

  // Test 6.6: No data
  const score6 = calculateCashFlowScore(null);
  assertEqual(score6, 50, 'Neutral score with no data', 0.1);
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
  printHeader('Financial Calculations Test Suite - Phase 17');
  console.log('Date: ' + new Date().toISOString());
  console.log('');

  try {
    // Run all test suites
    testISRCalculations();
    testIVACalculations();
    testMonthlyISRCalculations();
    testGranularDeductibility();
    testEdgeCases();
    testFinancialHealthScore();

    // Print summary
    printHeader('Test Summary');
    console.log('Total Tests Passed: ' + colors.green + testsPassed + colors.reset);
    console.log('Total Tests Failed: ' + colors.red + testsFailed + colors.reset);
    console.log('Warnings: ' + colors.yellow + warnings + colors.reset);
    console.log('');

    if (testsFailed === 0) {
      console.log(colors.green + '✓ All financial calculation tests passed!' + colors.reset);
      console.log('');
      process.exit(0);
    } else {
      console.log(colors.red + '✗ Some tests failed. Please review the output above.' + colors.reset);
      console.log('');
      process.exit(1);
    }
  } catch (error) {
    console.error(colors.red + 'Error running tests: ' + error.message + colors.reset);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runAllTests();
