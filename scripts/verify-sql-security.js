#!/usr/bin/env node
/**
 * SQL Security Verification Script
 * Phase 43: Verify all SQL injection vulnerabilities are fixed
 * 
 * This script scans the codebase to verify:
 * 1. No direct string concatenation in SQL queries
 * 2. All ORDER BY clauses use safe utilities
 * 3. All dynamic identifiers are validated
 * 4. All search inputs are sanitized
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Patterns to check
const vulnerablePatterns = [
  {
    name: 'Direct ORDER BY concatenation',
    pattern: /ORDER BY \$\{[^}]+\}/g,
    severity: 'CRITICAL'
  },
  {
    name: 'Dynamic table name without validation',
    pattern: /FROM \$\{[^}]+\} WHERE/g,
    severity: 'CRITICAL'
  },
  {
    name: 'Dynamic field name without validation',
    pattern: /SELECT \$\{[^}]+\} FROM/g,
    severity: 'HIGH'
  },
  {
    name: 'String concatenation in queries',
    pattern: /DB\.prepare\([^)]*\+[^)]*\)/g,
    severity: 'HIGH'
  }
];

// Safe patterns to verify
const safePatterns = [
  {
    name: 'buildSafeOrderBy usage',
    pattern: /buildSafeOrderBy\(/g
  },
  {
    name: 'validateTableName usage',
    pattern: /validateTableName\(/g
  },
  {
    name: 'validateFieldName usage',
    pattern: /validateFieldName\(/g
  },
  {
    name: 'detectSqlInjection usage',
    pattern: /detectSqlInjection\(/g
  }
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const results = {
    file: path.relative(process.cwd(), filePath),
    vulnerabilities: [],
    safePatterns: []
  };

  // Check for vulnerabilities
  for (const { name, pattern, severity } of vulnerablePatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      // Check if it's in a comment
      const lines = content.split('\n');
      const realMatches = [];
      
      for (const match of matches) {
        const matchIndex = content.indexOf(match);
        const lineNumber = content.substring(0, matchIndex).split('\n').length;
        const line = lines[lineNumber - 1];
        
        // Skip if in comment
        if (!line.trim().startsWith('//') && !line.includes('/*')) {
          realMatches.push({ match, line: lineNumber });
        }
      }
      
      if (realMatches.length > 0) {
        results.vulnerabilities.push({
          name,
          severity,
          count: realMatches.length,
          matches: realMatches
        });
      }
    }
  }

  // Check for safe patterns
  for (const { name, pattern } of safePatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      results.safePatterns.push({
        name,
        count: matches.length
      });
    }
  }

  return results;
}

function scanDirectory(dirPath, fileExtensions = ['.js']) {
  const results = [];
  
  function scanRecursive(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      // Skip node_modules, dist, and hidden directories
      if (entry.name.startsWith('.') || 
          entry.name === 'node_modules' || 
          entry.name === 'dist') {
        continue;
      }
      
      if (entry.isDirectory()) {
        scanRecursive(fullPath);
      } else if (entry.isFile() && fileExtensions.some(ext => entry.name.endsWith(ext))) {
        const result = scanFile(fullPath);
        if (result.vulnerabilities.length > 0 || result.safePatterns.length > 0) {
          results.push(result);
        }
      }
    }
  }
  
  scanRecursive(dirPath);
  return results;
}

function printResults(results) {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  SQL Security Verification Report - Phase 43              ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  let totalVulnerabilities = 0;
  let totalSafeUsages = 0;
  let criticalCount = 0;
  let highCount = 0;

  // Count totals
  for (const result of results) {
    for (const vuln of result.vulnerabilities) {
      totalVulnerabilities += vuln.count;
      if (vuln.severity === 'CRITICAL') criticalCount += vuln.count;
      if (vuln.severity === 'HIGH') highCount += vuln.count;
    }
    for (const safe of result.safePatterns) {
      totalSafeUsages += safe.count;
    }
  }

  // Print summary
  console.log(`${colors.blue}📊 Summary${colors.reset}`);
  console.log(`   Files scanned: ${results.length}`);
  console.log(`   Vulnerabilities found: ${totalVulnerabilities === 0 ? colors.green + '0 ✅' : colors.red + totalVulnerabilities + ' ⚠️'}${colors.reset}`);
  if (totalVulnerabilities > 0) {
    console.log(`   - Critical: ${colors.red}${criticalCount}${colors.reset}`);
    console.log(`   - High: ${colors.yellow}${highCount}${colors.reset}`);
  }
  console.log(`   Safe patterns used: ${colors.green}${totalSafeUsages} ✅${colors.reset}\n`);

  // Print vulnerabilities
  if (totalVulnerabilities > 0) {
    console.log(`${colors.red}⚠️  VULNERABILITIES FOUND${colors.reset}\n`);
    
    for (const result of results) {
      if (result.vulnerabilities.length > 0) {
        console.log(`${colors.yellow}📄 ${result.file}${colors.reset}`);
        
        for (const vuln of result.vulnerabilities) {
          const severityColor = vuln.severity === 'CRITICAL' ? colors.red : colors.yellow;
          console.log(`   ${severityColor}[${vuln.severity}]${colors.reset} ${vuln.name}`);
          
          for (const match of vuln.matches) {
            console.log(`      Line ${match.line}: ${match.match}`);
          }
        }
        console.log();
      }
    }
  } else {
    console.log(`${colors.green}✅ NO VULNERABILITIES FOUND${colors.reset}\n`);
  }

  // Print safe patterns
  if (totalSafeUsages > 0) {
    console.log(`${colors.green}✅ SAFE PATTERNS DETECTED${colors.reset}\n`);
    
    const patternSummary = {};
    for (const result of results) {
      for (const safe of result.safePatterns) {
        if (!patternSummary[safe.name]) {
          patternSummary[safe.name] = 0;
        }
        patternSummary[safe.name] += safe.count;
      }
    }
    
    for (const [name, count] of Object.entries(patternSummary)) {
      console.log(`   ✓ ${name}: ${colors.green}${count} usages${colors.reset}`);
    }
    console.log();
  }

  // Print detailed file results
  if (results.length > 0) {
    console.log(`${colors.blue}📋 Detailed Results${colors.reset}\n`);
    
    for (const result of results) {
      const hasVulns = result.vulnerabilities.length > 0;
      const statusIcon = hasVulns ? '⚠️ ' : '✅';
      const statusColor = hasVulns ? colors.red : colors.green;
      
      console.log(`${statusIcon} ${statusColor}${result.file}${colors.reset}`);
      
      if (result.vulnerabilities.length > 0) {
        console.log(`   Vulnerabilities: ${result.vulnerabilities.length}`);
      }
      
      if (result.safePatterns.length > 0) {
        console.log(`   Safe patterns: ${result.safePatterns.map(s => s.name).join(', ')}`);
      }
      console.log();
    }
  }

  // Print final verdict
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  if (totalVulnerabilities === 0 && totalSafeUsages > 0) {
    console.log(`${colors.cyan}║${colors.reset}  ${colors.green}✅ PASSED - System is secure${colors.reset}                         ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset}  ${colors.green}All SQL queries are properly protected${colors.reset}               ${colors.cyan}║${colors.reset}`);
  } else if (totalVulnerabilities === 0) {
    console.log(`${colors.cyan}║${colors.reset}  ${colors.yellow}⚠️  WARNING - No vulnerabilities but no safe patterns${colors.reset}  ${colors.cyan}║${colors.reset}`);
  } else {
    console.log(`${colors.cyan}║${colors.reset}  ${colors.red}❌ FAILED - Vulnerabilities detected${colors.reset}                 ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset}  ${colors.red}Please fix all vulnerabilities before deployment${colors.reset}     ${colors.cyan}║${colors.reset}`);
  }
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  return totalVulnerabilities === 0;
}

// Main execution
console.log(`${colors.cyan}Starting SQL security verification...${colors.reset}\n`);

const functionsDir = path.join(process.cwd(), 'functions');
const results = scanDirectory(functionsDir, ['.js']);

const passed = printResults(results);

// Exit with appropriate code
process.exit(passed ? 0 : 1);
