/**
 * Relationship Detector Utility
 * 
 * Detects relationships between financial entities based on metadata
 * Helps identify items from the same institution, related accounts, etc.
 */

/**
 * Parse metadata string or object
 * @param {string|object} metadata - Metadata as JSON string or object
 * @returns {object} Parsed metadata object
 */
export function parseMetadata(metadata) {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch (e) {
      console.error('Failed to parse metadata:', e);
      return {};
    }
  }
  return metadata;
}

/**
 * Extract common institution names from metadata
 * @param {object} metadata - Parsed metadata
 * @returns {string|null} Institution name if found
 */
export function extractInstitution(metadata) {
  const meta = parseMetadata(metadata);
  
  // Check common field names for institution
  const institutionFields = ['bank_name', 'broker', 'creditor_type', 'broker_platform', 'original_creditor'];
  
  for (const field of institutionFields) {
    if (meta[field]) {
      return meta[field].toString().toLowerCase().trim();
    }
  }
  
  return null;
}

/**
 * Find related items by matching metadata fields
 * @param {Array} items - Array of items to search
 * @param {object} targetMetadata - Metadata to match against
 * @param {Array} fieldsToMatch - Fields to match (defaults to common institution fields)
 * @returns {Array} Array of related items
 */
export function findRelatedItems(items, targetMetadata, fieldsToMatch = ['bank_name', 'broker', 'creditor_type']) {
  if (!items || items.length === 0) return [];
  
  const targetMeta = parseMetadata(targetMetadata);
  if (Object.keys(targetMeta).length === 0) return [];
  
  const relatedItems = [];
  
  items.forEach(item => {
    const itemMeta = parseMetadata(item.metadata);
    if (Object.keys(itemMeta).length === 0) return;
    
    // Check if any of the fields match
    let hasMatch = false;
    for (const field of fieldsToMatch) {
      if (targetMeta[field] && itemMeta[field]) {
        if (targetMeta[field].toString().toLowerCase() === itemMeta[field].toString().toLowerCase()) {
          hasMatch = true;
          break;
        }
      }
    }
    
    if (hasMatch) {
      relatedItems.push({
        ...item,
        matchedField: fieldsToMatch.find(f => 
          targetMeta[f] && itemMeta[f] && 
          targetMeta[f].toString().toLowerCase() === itemMeta[f].toString().toLowerCase()
        )
      });
    }
  });
  
  return relatedItems;
}

/**
 * Group items by institution
 * @param {Array} items - Array of items with metadata
 * @param {string} entityType - Type of entity (accounts, credits, debts, investments)
 * @returns {object} Object with institutions as keys and arrays of items as values
 */
export function groupByInstitution(items, entityType = 'accounts') {
  if (!items || items.length === 0) return {};
  
  const groups = {};
  
  items.forEach(item => {
    const institution = extractInstitution(item.metadata);
    
    if (institution) {
      if (!groups[institution]) {
        groups[institution] = [];
      }
      groups[institution].push(item);
    } else {
      // Group items without institution under "Sin institución"
      if (!groups['_no_institution']) {
        groups['_no_institution'] = [];
      }
      groups['_no_institution'].push(item);
    }
  });
  
  return groups;
}

/**
 * Calculate total balance per institution
 * @param {Array} items - Array of items with balance field and metadata
 * @param {string} balanceField - Name of the balance field (default: 'balance')
 * @returns {object} Object with institutions as keys and total balances as values
 */
export function calculateInstitutionBalances(items, balanceField = 'balance') {
  const groups = groupByInstitution(items);
  const balances = {};
  
  Object.entries(groups).forEach(([institution, institutionItems]) => {
    const total = institutionItems.reduce((sum, item) => {
      const balance = parseFloat(item[balanceField]) || 0;
      return sum + balance;
    }, 0);
    
    balances[institution] = {
      total,
      count: institutionItems.length,
      items: institutionItems
    };
  });
  
  return balances;
}

/**
 * Suggest metadata fields that should be filled
 * @param {Array} items - Array of items
 * @param {Array} requiredFields - Fields that should be present
 * @returns {Array} Array of suggestions
 */
export function suggestMissingMetadata(items, requiredFields = ['bank_name', 'broker', 'creditor_type']) {
  const suggestions = [];
  
  items.forEach(item => {
    const meta = parseMetadata(item.metadata);
    const missingFields = [];
    
    requiredFields.forEach(field => {
      if (!meta[field]) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      suggestions.push({
        item,
        missingFields,
        priority: missingFields.length // More missing fields = higher priority
      });
    }
  });
  
  // Sort by priority (most missing fields first)
  suggestions.sort((a, b) => b.priority - a.priority);
  
  return suggestions;
}

/**
 * Find potential duplicates based on metadata similarity
 * @param {Array} items - Array of items
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {Array} Array of potential duplicate pairs
 */
export function findPotentialDuplicates(items, threshold = 0.7) {
  if (!items || items.length < 2) return [];
  
  const duplicates = [];
  
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const item1 = items[i];
      const item2 = items[j];
      
      const meta1 = parseMetadata(item1.metadata);
      const meta2 = parseMetadata(item2.metadata);
      
      if (Object.keys(meta1).length === 0 || Object.keys(meta2).length === 0) {
        continue;
      }
      
      // Calculate similarity based on matching fields
      const allFields = new Set([...Object.keys(meta1), ...Object.keys(meta2)]);
      let matchingFields = 0;
      
      allFields.forEach(field => {
        if (meta1[field] && meta2[field]) {
          if (meta1[field].toString().toLowerCase() === meta2[field].toString().toLowerCase()) {
            matchingFields++;
          }
        }
      });
      
      const similarity = matchingFields / allFields.size;
      
      if (similarity >= threshold) {
        duplicates.push({
          item1,
          item2,
          similarity,
          matchingFields: matchingFields
        });
      }
    }
  }
  
  return duplicates;
}

/**
 * Get all unique metadata values for a specific field
 * @param {Array} items - Array of items
 * @param {string} field - Metadata field name
 * @returns {Array} Array of unique values
 */
export function getUniqueMetadataValues(items, field) {
  if (!items || items.length === 0) return [];
  
  const values = new Set();
  
  items.forEach(item => {
    const meta = parseMetadata(item.metadata);
    if (meta[field]) {
      values.add(meta[field].toString());
    }
  });
  
  return Array.from(values).sort();
}

/**
 * Calculate diversification score based on institution distribution
 * @param {Array} items - Array of items with metadata
 * @returns {object} Diversification metrics
 */
export function calculateDiversification(items) {
  if (!items || items.length === 0) {
    return {
      score: 0,
      institutionCount: 0,
      itemCount: 0,
      distribution: {}
    };
  }
  
  const groups = groupByInstitution(items);
  const institutionCount = Object.keys(groups).filter(k => k !== '_no_institution').length;
  const itemCount = items.length;
  
  // Calculate distribution percentages
  const distribution = {};
  Object.entries(groups).forEach(([institution, institutionItems]) => {
    if (institution !== '_no_institution') {
      distribution[institution] = {
        count: institutionItems.length,
        percentage: (institutionItems.length / itemCount) * 100
      };
    }
  });
  
  // Score based on number of institutions and even distribution
  // Perfect score: many institutions with even distribution
  let score = 0;
  if (institutionCount > 0) {
    const idealPercentage = 100 / institutionCount;
    let totalDeviation = 0;
    
    Object.values(distribution).forEach(({ percentage }) => {
      totalDeviation += Math.abs(percentage - idealPercentage);
    });
    
    const averageDeviation = totalDeviation / institutionCount;
    const evenDistributionScore = Math.max(0, 100 - averageDeviation);
    
    // Combine institution count and distribution
    const institutionScore = Math.min(institutionCount * 20, 50); // Max 50 points for having multiple institutions
    score = (institutionScore + evenDistributionScore) / 2;
  }
  
  return {
    score: Math.round(score),
    institutionCount,
    itemCount,
    distribution
  };
}
