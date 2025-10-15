/**
 * Advanced Analytics Utility
 * 
 * Provides sophisticated financial analysis algorithms:
 * - Financial health scoring (0-100 scale)
 * - Cash flow forecasting with trend analysis
 * - Profitability analysis and margin tracking
 * - Business performance KPIs
 * 
 * @module advancedAnalytics
 */

/**
 * Calculate comprehensive financial health score (0-100)
 * 
 * Scoring criteria:
 * - Liquidity (30%): Current ratio, quick ratio, cash reserves
 * - Profitability (25%): Profit margin, ROI
 * - Solvency (20%): Debt-to-equity, interest coverage
 * - Efficiency (15%): Asset turnover, receivables turnover
 * - Growth (10%): Revenue growth, profit growth
 * 
 * @param {Object} financialData - Financial metrics
 * @returns {Object} Health score with breakdown
 */
export function calculateFinancialHealthScore(financialData) {
  const {
    currentAssets = 0,
    currentLiabilities = 0,
    totalAssets = 0,
    totalLiabilities = 0,
    revenue = 0,
    expenses = 0,
    netIncome = 0,
    cashReserves = 0,
    accountsReceivable = 0,
    accountsPayable = 0,
    previousRevenue = 0,
    previousNetIncome = 0
  } = financialData;

  // Liquidity Score (30 points)
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 1;
  const cashRatio = currentLiabilities > 0 ? cashReserves / currentLiabilities : 1;
  let liquidityScore = 0;
  
  if (currentRatio >= 2) liquidityScore += 15;
  else if (currentRatio >= 1.5) liquidityScore += 12;
  else if (currentRatio >= 1) liquidityScore += 8;
  else liquidityScore += Math.max(0, currentRatio * 5);
  
  if (cashRatio >= 0.5) liquidityScore += 15;
  else if (cashRatio >= 0.3) liquidityScore += 12;
  else if (cashRatio >= 0.1) liquidityScore += 8;
  else liquidityScore += Math.max(0, cashRatio * 20);

  // Profitability Score (25 points)
  const profitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
  const roi = totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0;
  let profitabilityScore = 0;
  
  if (profitMargin >= 20) profitabilityScore += 15;
  else if (profitMargin >= 10) profitabilityScore += 12;
  else if (profitMargin >= 5) profitabilityScore += 8;
  else if (profitMargin > 0) profitabilityScore += 5;
  
  if (roi >= 15) profitabilityScore += 10;
  else if (roi >= 10) profitabilityScore += 8;
  else if (roi >= 5) profitabilityScore += 5;
  else if (roi > 0) profitabilityScore += 3;

  // Solvency Score (20 points)
  const debtToEquity = (totalAssets - totalLiabilities) > 0 
    ? totalLiabilities / (totalAssets - totalLiabilities) 
    : 5;
  const debtToAssets = totalAssets > 0 ? totalLiabilities / totalAssets : 1;
  let solvencyScore = 0;
  
  if (debtToEquity <= 0.5) solvencyScore += 12;
  else if (debtToEquity <= 1) solvencyScore += 10;
  else if (debtToEquity <= 2) solvencyScore += 6;
  else solvencyScore += Math.max(0, 10 - debtToEquity);
  
  if (debtToAssets <= 0.3) solvencyScore += 8;
  else if (debtToAssets <= 0.5) solvencyScore += 6;
  else if (debtToAssets <= 0.7) solvencyScore += 4;
  else solvencyScore += Math.max(0, 10 - debtToAssets * 10);

  // Efficiency Score (15 points)
  const receivablesTurnover = revenue > 0 && accountsReceivable > 0 
    ? revenue / accountsReceivable 
    : 12;
  const assetTurnover = totalAssets > 0 ? revenue / totalAssets : 1;
  let efficiencyScore = 0;
  
  if (receivablesTurnover >= 10) efficiencyScore += 8;
  else if (receivablesTurnover >= 6) efficiencyScore += 6;
  else if (receivablesTurnover >= 4) efficiencyScore += 4;
  else efficiencyScore += Math.max(0, receivablesTurnover);
  
  if (assetTurnover >= 2) efficiencyScore += 7;
  else if (assetTurnover >= 1) efficiencyScore += 5;
  else if (assetTurnover >= 0.5) efficiencyScore += 3;
  else efficiencyScore += Math.max(0, assetTurnover * 3);

  // Growth Score (10 points)
  const revenueGrowth = previousRevenue > 0 
    ? ((revenue - previousRevenue) / previousRevenue) * 100 
    : 0;
  const profitGrowth = previousNetIncome > 0 
    ? ((netIncome - previousNetIncome) / Math.abs(previousNetIncome)) * 100 
    : 0;
  let growthScore = 0;
  
  if (revenueGrowth >= 20) growthScore += 5;
  else if (revenueGrowth >= 10) growthScore += 4;
  else if (revenueGrowth >= 5) growthScore += 3;
  else if (revenueGrowth > 0) growthScore += 2;
  
  if (profitGrowth >= 20) growthScore += 5;
  else if (profitGrowth >= 10) growthScore += 4;
  else if (profitGrowth >= 5) growthScore += 3;
  else if (profitGrowth > 0) growthScore += 2;

  // Calculate total score
  const totalScore = Math.min(100, Math.round(
    liquidityScore + profitabilityScore + solvencyScore + efficiencyScore + growthScore
  ));

  // Determine rating
  let rating, color, message;
  if (totalScore >= 80) {
    rating = 'Excelente';
    color = 'green';
    message = 'Tu negocio muestra una salud financiera excepcional';
  } else if (totalScore >= 60) {
    rating = 'Bueno';
    color = 'blue';
    message = 'Tu negocio tiene una salud financiera sólida';
  } else if (totalScore >= 40) {
    rating = 'Aceptable';
    color = 'yellow';
    message = 'Tu negocio tiene áreas de mejora en salud financiera';
  } else {
    rating = 'Requiere atención';
    color = 'red';
    message = 'Tu negocio requiere mejoras urgentes en salud financiera';
  }

  return {
    score: totalScore,
    rating,
    color,
    message,
    breakdown: {
      liquidity: {
        score: Math.round(liquidityScore),
        maxScore: 30,
        metrics: {
          currentRatio: currentRatio.toFixed(2),
          cashRatio: cashRatio.toFixed(2)
        }
      },
      profitability: {
        score: Math.round(profitabilityScore),
        maxScore: 25,
        metrics: {
          profitMargin: profitMargin.toFixed(2) + '%',
          roi: roi.toFixed(2) + '%'
        }
      },
      solvency: {
        score: Math.round(solvencyScore),
        maxScore: 20,
        metrics: {
          debtToEquity: debtToEquity.toFixed(2),
          debtToAssets: (debtToAssets * 100).toFixed(2) + '%'
        }
      },
      efficiency: {
        score: Math.round(efficiencyScore),
        maxScore: 15,
        metrics: {
          receivablesTurnover: receivablesTurnover.toFixed(2),
          assetTurnover: assetTurnover.toFixed(2)
        }
      },
      growth: {
        score: Math.round(growthScore),
        maxScore: 10,
        metrics: {
          revenueGrowth: revenueGrowth.toFixed(2) + '%',
          profitGrowth: profitGrowth.toFixed(2) + '%'
        }
      }
    },
    recommendations: generateRecommendations({
      liquidityScore,
      profitabilityScore,
      solvencyScore,
      efficiencyScore,
      growthScore,
      currentRatio,
      profitMargin,
      debtToEquity
    })
  };
}

/**
 * Generate personalized financial recommendations
 */
function generateRecommendations(scores) {
  const recommendations = [];

  if (scores.liquidityScore < 20) {
    recommendations.push({
      category: 'Liquidez',
      priority: 'high',
      message: 'Mejora tu liquidez reduciendo gastos o aumentando reservas de efectivo',
      actions: [
        'Negocia mejores términos de pago con proveedores',
        'Acelera la cobranza de cuentas por cobrar',
        'Considera una línea de crédito de emergencia'
      ]
    });
  }

  if (scores.profitabilityScore < 15) {
    recommendations.push({
      category: 'Rentabilidad',
      priority: 'high',
      message: 'Aumenta tu rentabilidad optimizando costos y mejorando precios',
      actions: [
        'Revisa y optimiza tus costos operativos',
        'Evalúa tu estrategia de precios',
        'Identifica productos/servicios más rentables'
      ]
    });
  }

  if (scores.solvencyScore < 12) {
    recommendations.push({
      category: 'Solvencia',
      priority: 'high',
      message: 'Reduce tu endeudamiento para mejorar la solvencia',
      actions: [
        'Prioriza el pago de deudas de alto interés',
        'Evita adquirir nuevas deudas innecesarias',
        'Considera refinanciar deudas caras'
      ]
    });
  }

  if (scores.efficiencyScore < 10) {
    recommendations.push({
      category: 'Eficiencia',
      priority: 'medium',
      message: 'Mejora la eficiencia operativa de tu negocio',
      actions: [
        'Implementa procesos de cobranza más efectivos',
        'Optimiza el uso de tus activos',
        'Automatiza procesos repetitivos'
      ]
    });
  }

  if (scores.growthScore < 5) {
    recommendations.push({
      category: 'Crecimiento',
      priority: 'medium',
      message: 'Enfócate en estrategias de crecimiento sostenible',
      actions: [
        'Desarrolla nuevas líneas de productos/servicios',
        'Invierte en marketing y ventas',
        'Explora nuevos mercados o segmentos'
      ]
    });
  }

  if (scores.currentRatio < 1) {
    recommendations.push({
      category: 'Riesgo',
      priority: 'critical',
      message: 'Tu ratio corriente es bajo - riesgo de insolvencia a corto plazo',
      actions: [
        'Revisa todos los gastos no esenciales inmediatamente',
        'Busca financiamiento de emergencia',
        'Acelera la conversión de inventario a efectivo'
      ]
    });
  }

  return recommendations;
}

/**
 * Forecast cash flow for future periods
 * 
 * @param {Array} historicalData - Historical transaction data
 * @param {Number} periods - Number of periods to forecast
 * @returns {Object} Cash flow forecast
 */
export function forecastCashFlow(historicalData, periods = 3) {
  if (!historicalData || historicalData.length === 0) {
    return {
      forecasts: [],
      confidence: 0,
      trend: 'insufficient_data'
    };
  }

  // Calculate trends from historical data
  const monthlyData = aggregateByMonth(historicalData);
  
  // Calculate linear regression for income and expenses
  const incomeRegression = calculateLinearRegression(
    monthlyData.map((m, i) => ({ x: i, y: m.income }))
  );
  const expenseRegression = calculateLinearRegression(
    monthlyData.map((m, i) => ({ x: i, y: m.expenses }))
  );

  // Generate forecasts
  const forecasts = [];
  const lastIndex = monthlyData.length - 1;
  let runningBalance = monthlyData[lastIndex]?.balance || 0;

  for (let i = 1; i <= periods; i++) {
    const forecastIndex = lastIndex + i;
    
    const forecastedIncome = Math.max(0, 
      incomeRegression.slope * forecastIndex + incomeRegression.intercept
    );
    const forecastedExpenses = Math.max(0,
      expenseRegression.slope * forecastIndex + expenseRegression.intercept
    );
    const netCashFlow = forecastedIncome - forecastedExpenses;
    runningBalance += netCashFlow;

    // Calculate confidence based on historical variance
    const confidence = calculateConfidence(monthlyData, i);

    forecasts.push({
      period: i,
      month: getFutureMonthLabel(i),
      income: Math.round(forecastedIncome),
      expenses: Math.round(forecastedExpenses),
      netCashFlow: Math.round(netCashFlow),
      projectedBalance: Math.round(runningBalance),
      confidence: Math.round(confidence * 100)
    });
  }

  // Determine overall trend
  const trend = incomeRegression.slope > expenseRegression.slope 
    ? 'improving' 
    : incomeRegression.slope < expenseRegression.slope 
    ? 'declining' 
    : 'stable';

  return {
    forecasts,
    trend,
    trendStrength: Math.abs(incomeRegression.slope - expenseRegression.slope),
    historicalAverage: {
      income: Math.round(average(monthlyData.map(m => m.income))),
      expenses: Math.round(average(monthlyData.map(m => m.expenses)))
    }
  };
}

/**
 * Aggregate transaction data by month
 */
function aggregateByMonth(transactions) {
  const monthMap = new Map();

  transactions.forEach(t => {
    const month = t.date.substring(0, 7); // YYYY-MM
    if (!monthMap.has(month)) {
      monthMap.set(month, { income: 0, expenses: 0, balance: 0 });
    }
    const data = monthMap.get(month);
    if (t.amount > 0) {
      data.income += t.amount;
    } else {
      data.expenses += Math.abs(t.amount);
    }
    data.balance = data.income - data.expenses;
  });

  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => ({ month, ...data }));
}

/**
 * Calculate linear regression
 */
function calculateLinearRegression(points) {
  const n = points.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Calculate forecast confidence
 */
function calculateConfidence(historicalData, periodsAhead) {
  if (historicalData.length < 3) return 0.5;

  // Calculate coefficient of variation
  const values = historicalData.map(m => m.income + m.expenses);
  const mean = average(values);
  const stdDev = standardDeviation(values);
  const cv = mean > 0 ? stdDev / mean : 1;

  // Confidence decreases with periods ahead and variability
  const baseConfidence = 0.9;
  const variabilityPenalty = Math.min(0.4, cv * 0.5);
  const distancePenalty = (periodsAhead - 1) * 0.1;

  return Math.max(0.3, baseConfidence - variabilityPenalty - distancePenalty);
}

/**
 * Get future month label
 */
function getFutureMonthLabel(periodsAhead) {
  const date = new Date();
  date.setMonth(date.getMonth() + periodsAhead);
  return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}

/**
 * Calculate average
 */
function average(arr) {
  return arr.length > 0 ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0;
}

/**
 * Calculate standard deviation
 */
function standardDeviation(arr) {
  const avg = average(arr);
  const squareDiffs = arr.map(val => Math.pow(val - avg, 2));
  return Math.sqrt(average(squareDiffs));
}

/**
 * Analyze profitability by category, product, or service
 * 
 * @param {Array} transactions - Transaction data
 * @param {String} groupBy - Group by 'category', 'account', or 'type'
 * @returns {Object} Profitability analysis
 */
export function analyzeProfitability(transactions, groupBy = 'category') {
  if (!transactions || transactions.length === 0) {
    return { groups: [], totalRevenue: 0, totalExpenses: 0, totalProfit: 0 };
  }

  const groups = new Map();
  let totalRevenue = 0;
  let totalExpenses = 0;

  transactions.forEach(t => {
    const key = t[groupBy] || 'Sin clasificar';
    if (!groups.has(key)) {
      groups.set(key, {
        name: key,
        revenue: 0,
        expenses: 0,
        transactions: 0,
        profit: 0,
        margin: 0
      });
    }

    const group = groups.get(key);
    group.transactions++;

    if (t.amount > 0) {
      group.revenue += t.amount;
      totalRevenue += t.amount;
    } else {
      group.expenses += Math.abs(t.amount);
      totalExpenses += Math.abs(t.amount);
    }
  });

  // Calculate profit and margin for each group
  const groupsArray = Array.from(groups.values()).map(g => {
    g.profit = g.revenue - g.expenses;
    g.margin = g.revenue > 0 ? (g.profit / g.revenue) * 100 : 0;
    g.revenueShare = totalRevenue > 0 ? (g.revenue / totalRevenue) * 100 : 0;
    g.expenseShare = totalExpenses > 0 ? (g.expenses / totalExpenses) * 100 : 0;
    return g;
  });

  // Sort by profit (descending)
  groupsArray.sort((a, b) => b.profit - a.profit);

  const totalProfit = totalRevenue - totalExpenses;
  const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    groups: groupsArray,
    totalRevenue,
    totalExpenses,
    totalProfit,
    totalMargin,
    summary: {
      topPerformer: groupsArray[0]?.name,
      topPerformerProfit: groupsArray[0]?.profit || 0,
      worstPerformer: groupsArray[groupsArray.length - 1]?.name,
      worstPerformerProfit: groupsArray[groupsArray.length - 1]?.profit || 0,
      averageMargin: average(groupsArray.map(g => g.margin))
    }
  };
}

/**
 * Calculate key business performance indicators (KPIs)
 * 
 * @param {Object} businessData - Business metrics
 * @returns {Object} KPI dashboard
 */
export function calculateBusinessKPIs(businessData) {
  const {
    revenue = 0,
    expenses = 0,
    netIncome = 0,
    totalAssets = 0,
    totalLiabilities = 0,
    accountsReceivable = 0,
    accountsPayable = 0,
    inventory = 0,
    cashReserves = 0,
    employeeCount = 1,
    customerCount = 0,
    previousRevenue = 0,
    previousExpenses = 0,
    transactions = []
  } = businessData;

  // Financial KPIs
  const profitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
  const grossMargin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;
  const operatingMargin = profitMargin; // Simplified
  const roi = totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0;
  const roa = totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0;
  const roe = (totalAssets - totalLiabilities) > 0 
    ? (netIncome / (totalAssets - totalLiabilities)) * 100 
    : 0;

  // Liquidity KPIs
  const currentRatio = totalLiabilities > 0 ? totalAssets / totalLiabilities : 1;
  const quickRatio = totalLiabilities > 0 
    ? (cashReserves + accountsReceivable) / totalLiabilities 
    : 1;
  const cashRatio = totalLiabilities > 0 ? cashReserves / totalLiabilities : 1;

  // Efficiency KPIs
  const assetTurnover = totalAssets > 0 ? revenue / totalAssets : 0;
  const receivablesTurnover = accountsReceivable > 0 ? revenue / accountsReceivable : 12;
  const daysReceivableOutstanding = receivablesTurnover > 0 
    ? 365 / receivablesTurnover 
    : 30;
  const payablesTurnover = accountsPayable > 0 ? expenses / accountsPayable : 12;
  const daysPayableOutstanding = payablesTurnover > 0 ? 365 / payablesTurnover : 30;

  // Growth KPIs
  const revenueGrowth = previousRevenue > 0 
    ? ((revenue - previousRevenue) / previousRevenue) * 100 
    : 0;
  const expenseGrowth = previousExpenses > 0 
    ? ((expenses - previousExpenses) / previousExpenses) * 100 
    : 0;

  // Customer KPIs
  const revenuePerCustomer = customerCount > 0 ? revenue / customerCount : 0;
  const transactionsPerCustomer = customerCount > 0 
    ? transactions.length / customerCount 
    : 0;

  // Employee KPIs
  const revenuePerEmployee = employeeCount > 0 ? revenue / employeeCount : revenue;
  const profitPerEmployee = employeeCount > 0 ? netIncome / employeeCount : netIncome;

  return {
    financial: {
      profitMargin: { value: profitMargin, label: 'Margen de Utilidad', unit: '%', benchmark: 10 },
      grossMargin: { value: grossMargin, label: 'Margen Bruto', unit: '%', benchmark: 30 },
      operatingMargin: { value: operatingMargin, label: 'Margen Operativo', unit: '%', benchmark: 15 },
      roi: { value: roi, label: 'ROI', unit: '%', benchmark: 15 },
      roa: { value: roa, label: 'ROA', unit: '%', benchmark: 10 },
      roe: { value: roe, label: 'ROE', unit: '%', benchmark: 20 }
    },
    liquidity: {
      currentRatio: { value: currentRatio, label: 'Ratio Corriente', unit: '', benchmark: 2 },
      quickRatio: { value: quickRatio, label: 'Prueba Ácida', unit: '', benchmark: 1 },
      cashRatio: { value: cashRatio, label: 'Ratio de Efectivo', unit: '', benchmark: 0.5 }
    },
    efficiency: {
      assetTurnover: { value: assetTurnover, label: 'Rotación de Activos', unit: 'x', benchmark: 1 },
      receivablesTurnover: { value: receivablesTurnover, label: 'Rotación CxC', unit: 'x', benchmark: 8 },
      daysReceivableOutstanding: { value: daysReceivableOutstanding, label: 'Días CxC', unit: 'días', benchmark: 45 },
      payablesTurnover: { value: payablesTurnover, label: 'Rotación CxP', unit: 'x', benchmark: 8 },
      daysPayableOutstanding: { value: daysPayableOutstanding, label: 'Días CxP', unit: 'días', benchmark: 45 }
    },
    growth: {
      revenueGrowth: { value: revenueGrowth, label: 'Crecimiento Ingresos', unit: '%', benchmark: 10 },
      expenseGrowth: { value: expenseGrowth, label: 'Crecimiento Gastos', unit: '%', benchmark: 5 }
    },
    customer: {
      revenuePerCustomer: { value: revenuePerCustomer, label: 'Ingreso por Cliente', unit: '$', benchmark: 10000 },
      transactionsPerCustomer: { value: transactionsPerCustomer, label: 'Transacciones por Cliente', unit: '', benchmark: 5 }
    },
    employee: {
      revenuePerEmployee: { value: revenuePerEmployee, label: 'Ingreso por Empleado', unit: '$', benchmark: 100000 },
      profitPerEmployee: { value: profitPerEmployee, label: 'Utilidad por Empleado', unit: '$', benchmark: 20000 }
    }
  };
}

/**
 * Detect anomalies in financial data
 * 
 * @param {Array} transactions - Transaction data
 * @returns {Array} Detected anomalies
 */
export function detectAnomalies(transactions) {
  if (!transactions || transactions.length < 10) {
    return [];
  }

  const anomalies = [];
  
  // Calculate statistics by category
  const categoryStats = new Map();
  
  transactions.forEach(t => {
    const key = t.category || 'uncategorized';
    if (!categoryStats.has(key)) {
      categoryStats.set(key, { amounts: [], count: 0 });
    }
    categoryStats.get(key).amounts.push(Math.abs(t.amount));
    categoryStats.get(key).count++;
  });

  // Detect outliers using IQR method
  transactions.forEach((t, index) => {
    const key = t.category || 'uncategorized';
    const stats = categoryStats.get(key);
    
    if (stats.count >= 5) {
      const sorted = [...stats.amounts].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      const amount = Math.abs(t.amount);
      if (amount > upperBound) {
        anomalies.push({
          transaction: t,
          type: 'unusually_high',
          message: `Monto inusualmente alto para la categoría ${key}`,
          severity: amount > upperBound * 2 ? 'high' : 'medium',
          expectedRange: [lowerBound, upperBound]
        });
      } else if (amount < lowerBound && amount > 0) {
        anomalies.push({
          transaction: t,
          type: 'unusually_low',
          message: `Monto inusualmente bajo para la categoría ${key}`,
          severity: 'low',
          expectedRange: [lowerBound, upperBound]
        });
      }
    }
  });

  // Detect duplicate transactions
  const seen = new Map();
  transactions.forEach(t => {
    const key = `${t.date}_${t.amount}_${t.description}`;
    if (seen.has(key)) {
      anomalies.push({
        transaction: t,
        type: 'potential_duplicate',
        message: 'Posible transacción duplicada',
        severity: 'medium',
        original: seen.get(key)
      });
    } else {
      seen.set(key, t);
    }
  });

  return anomalies;
}

export default {
  calculateFinancialHealthScore,
  forecastCashFlow,
  analyzeProfitability,
  calculateBusinessKPIs,
  detectAnomalies
};
