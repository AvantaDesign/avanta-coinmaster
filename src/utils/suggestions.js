// Smart Category Suggestion System
// Uses pattern matching and keyword analysis to suggest categories

// Common keywords for each category type
const CATEGORY_KEYWORDS = {
  avanta: [
    // Services & Professional
    'servicio', 'proyecto', 'desarrollo', 'diseño', 'consultoría', 'consultoria',
    'freelance', 'cliente', 'factura', 'honorarios', 'contrato',
    // Business expenses
    'hosting', 'dominio', 'licencia', 'software', 'subscripción', 'suscripcion',
    'adobe', 'figma', 'notion', 'slack', 'zoom', 'aws', 'cloudflare',
    'oficina', 'equipo', 'computadora', 'laptop', 'monitor',
    'internet', 'teléfono', 'telefono', 'móvil', 'movil',
    // Tools & platforms
    'github', 'vercel', 'netlify', 'heroku', 'digital ocean',
    // Business services
    'contador', 'abogado', 'notario', 'gestoría', 'gestoria',
    'marketing', 'publicidad', 'ads', 'google ads', 'facebook ads',
    // Professional development
    'curso', 'capacitación', 'capacitacion', 'libro técnico', 'libro tecnico',
    'conferencia', 'seminario', 'certificación', 'certificacion'
  ],
  personal: [
    // Food & dining
    'comida', 'cena', 'desayuno', 'almuerzo', 'restaurante', 'café', 'cafe',
    'pizza', 'hamburguesa', 'tacos', 'tortas', 'sushi',
    'uber eats', 'rappi', 'didi food', 'sin delantal',
    // Shopping
    'ropa', 'zapatos', 'amazon', 'mercado libre', 'liverpool', 'palacio',
    'walmart', 'soriana', 'chedraui', 'oxxo', 'seven eleven', '7-eleven',
    // Entertainment
    'netflix', 'spotify', 'disney', 'hbo', 'amazon prime', 'youtube premium',
    'cine', 'película', 'pelicula', 'concierto', 'evento',
    // Transportation (personal)
    'uber', 'didi', 'gasolina', 'gas', 'estacionamiento', 'taxi',
    // Health & personal care
    'farmacia', 'doctor', 'médico', 'medico', 'hospital', 'clínica', 'clinica',
    'gimnasio', 'gym', 'dentista', 'óptica', 'optica',
    // Utilities (personal)
    'luz', 'agua', 'gas lp', 'teléfono personal', 'telefono personal',
    // Gifts & social
    'regalo', 'cumpleaños', 'cumpleanos', 'fiesta', 'salida'
  ]
};

// Amount ranges that typically indicate business vs personal
const AMOUNT_PATTERNS = {
  // Amounts that commonly suggest business transactions
  avanta: {
    ranges: [
      { min: 5000, max: 50000, weight: 0.3 },    // Common service fees
      { min: 100, max: 1000, weight: 0.2 }      // Software subscriptions
    ]
  },
  personal: {
    ranges: [
      { min: 50, max: 500, weight: 0.2 },       // Typical personal expenses
      { min: 10, max: 100, weight: 0.1 }        // Small purchases
    ]
  }
};

/**
 * Analyze transaction description and amount to suggest category
 * @param {string} description - Transaction description
 * @param {number} amount - Transaction amount
 * @param {Array} history - Array of past transactions for learning
 * @returns {Object} Suggestion with category, confidence, and reasons
 */
export function suggestCategory(description, amount, history = []) {
  if (!description) {
    return {
      category: 'personal',
      confidence: 0.5,
      reasons: ['Sin descripción - categoría por defecto']
    };
  }

  const descLower = description.toLowerCase();
  const scores = {
    avanta: 0,
    personal: 0
  };
  const reasons = {
    avanta: [],
    personal: []
  };

  // 1. Keyword matching (50% weight)
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let keywordMatches = 0;
    const matchedKeywords = [];
    
    for (const keyword of keywords) {
      if (descLower.includes(keyword.toLowerCase())) {
        keywordMatches++;
        matchedKeywords.push(keyword);
      }
    }
    
    if (keywordMatches > 0) {
      const keywordScore = Math.min(keywordMatches * 0.15, 0.5);
      scores[category] += keywordScore;
      reasons[category].push(
        `Palabras clave encontradas: ${matchedKeywords.slice(0, 3).join(', ')}`
      );
    }
  }

  // 2. Amount pattern analysis (20% weight)
  if (amount) {
    for (const [category, patterns] of Object.entries(AMOUNT_PATTERNS)) {
      for (const range of patterns.ranges) {
        if (amount >= range.min && amount <= range.max) {
          scores[category] += range.weight;
          reasons[category].push(
            `Monto típico de ${category} ($${range.min}-$${range.max})`
          );
          break;
        }
      }
    }
  }

  // 3. Historical pattern matching (30% weight)
  if (history && history.length > 0) {
    const historicalMatch = findHistoricalPattern(descLower, amount, history);
    if (historicalMatch) {
      scores[historicalMatch.category] += 0.3;
      reasons[historicalMatch.category].push(
        `Similar a "${historicalMatch.description}" (${historicalMatch.matches} coincidencias)`
      );
    }
  }

  // Determine winner
  const winner = scores.avanta > scores.personal ? 'avanta' : 'personal';
  const confidence = Math.max(scores.avanta, scores.personal);
  
  // Normalize confidence to 0-1 range
  const normalizedConfidence = Math.min(confidence, 1);

  return {
    category: winner,
    confidence: normalizedConfidence,
    reasons: reasons[winner],
    scores: {
      avanta: scores.avanta,
      personal: scores.personal
    }
  };
}

/**
 * Find similar transactions in history
 */
function findHistoricalPattern(description, amount, history) {
  const matches = {};
  
  for (const transaction of history) {
    if (!transaction.description || !transaction.category) continue;
    
    const transDesc = transaction.description.toLowerCase();
    const similarity = calculateSimilarity(description, transDesc);
    
    // Consider it a match if similarity > 0.6 or if key words match
    if (similarity > 0.6 || hasCommonWords(description, transDesc, 2)) {
      const category = transaction.category;
      if (!matches[category]) {
        matches[category] = {
          count: 0,
          description: transaction.description
        };
      }
      matches[category].count++;
    }
  }
  
  // Find category with most matches
  let bestMatch = null;
  let maxCount = 0;
  
  for (const [category, data] of Object.entries(matches)) {
    if (data.count > maxCount) {
      maxCount = data.count;
      bestMatch = {
        category,
        description: data.description,
        matches: data.count
      };
    }
  }
  
  return bestMatch;
}

/**
 * Calculate similarity between two strings (simple version)
 */
function calculateSimilarity(str1, str2) {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  let commonWords = 0;
  for (const word of words1) {
    if (words2.includes(word) && word.length > 3) {
      commonWords++;
    }
  }
  
  const totalWords = Math.max(words1.length, words2.length);
  return commonWords / totalWords;
}

/**
 * Check if two strings have a minimum number of common significant words
 */
function hasCommonWords(str1, str2, minWords) {
  const words1 = str1.split(/\s+/).filter(w => w.length > 3);
  const words2 = str2.split(/\s+/).filter(w => w.length > 3);
  
  let commonCount = 0;
  for (const word of words1) {
    if (words2.includes(word)) {
      commonCount++;
      if (commonCount >= minWords) return true;
    }
  }
  
  return false;
}

/**
 * Get multiple category suggestions with confidence scores
 * Useful for showing alternative suggestions
 */
export function getSuggestions(description, amount, history = []) {
  const mainSuggestion = suggestCategory(description, amount, history);
  
  return [
    {
      category: mainSuggestion.category,
      confidence: mainSuggestion.confidence,
      reasons: mainSuggestion.reasons,
      label: mainSuggestion.category === 'avanta' ? 'Avanta (Negocio)' : 'Personal'
    },
    {
      category: mainSuggestion.category === 'avanta' ? 'personal' : 'avanta',
      confidence: 1 - mainSuggestion.confidence,
      reasons: [],
      label: mainSuggestion.category === 'avanta' ? 'Personal' : 'Avanta (Negocio)'
    }
  ];
}

/**
 * Learn from user corrections
 * This could be used to improve suggestions over time
 */
export function recordCorrection(originalDescription, amount, suggestedCategory, actualCategory) {
  // In a real implementation, this would store the correction
  // to improve future suggestions
  // For now, we'll just return the data for potential storage
  return {
    description: originalDescription,
    amount,
    suggestedCategory,
    actualCategory,
    timestamp: new Date().toISOString()
  };
}
