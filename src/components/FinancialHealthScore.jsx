import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/calculations';
import Icon from './icons/IconLibrary';

/**
 * Financial Health Score Widget
 * Calculates and displays a comprehensive financial health score (0-100)
 * Based on key metrics: cash flow, debt-to-income, budget adherence, savings rate, account balance
 */
export default function FinancialHealthScore({ 
  cashFlowData, 
  debtData, 
  budgetData, 
  accountData,
  transactionData 
}) {
  const [score, setScore] = useState(0);
  const [breakdown, setBreakdown] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [trend, setTrend] = useState('neutral'); // improving, declining, neutral
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    calculateHealthScore();
  }, [cashFlowData, debtData, budgetData, accountData, transactionData]);

  const calculateHealthScore = () => {
    const metrics = [];
    let totalScore = 0;

    // 1. Cash Flow Health (30%)
    const cashFlowScore = calculateCashFlowScore(cashFlowData);
    metrics.push({
      name: 'Salud de Flujo de Efectivo',
      score: cashFlowScore,
      weight: 30,
      weightedScore: (cashFlowScore * 30) / 100,
      icon: 'banknotes',
      description: 'Balance entre ingresos y gastos'
    });
    totalScore += (cashFlowScore * 30) / 100;

    // 2. Debt-to-Income Ratio (25%)
    const debtScore = calculateDebtScore(debtData, transactionData);
    metrics.push({
      name: 'Relación Deuda-Ingresos',
      score: debtScore,
      weight: 25,
      weightedScore: (debtScore * 25) / 100,
      icon: 'scale',
      description: 'Pagos de deuda vs ingresos'
    });
    totalScore += (debtScore * 25) / 100;

    // 3. Budget Adherence (20%)
    const budgetScore = calculateBudgetScore(budgetData);
    metrics.push({
      name: 'Adherencia al Presupuesto',
      score: budgetScore,
      weight: 20,
      weightedScore: (budgetScore * 20) / 100,
      icon: 'chartBar',
      description: 'Gastos vs límites presupuestados'
    });
    totalScore += (budgetScore * 20) / 100;

    // 4. Savings Rate (15%)
    const savingsScore = calculateSavingsScore(transactionData);
    metrics.push({
      name: 'Tasa de Ahorro',
      score: savingsScore,
      weight: 15,
      weightedScore: (savingsScore * 15) / 100,
      icon: 'piggyBank',
      description: 'Porcentaje de ingresos ahorrados'
    });
    totalScore += (savingsScore * 15) / 100;

    // 5. Account Balance Health (10%)
    const balanceScore = calculateBalanceScore(accountData);
    metrics.push({
      name: 'Salud de Saldos',
      score: balanceScore,
      weight: 10,
      weightedScore: (balanceScore * 10) / 100,
      icon: 'buildingLibrary',
      description: 'Tendencia de saldos de cuentas'
    });
    totalScore += (balanceScore * 10) / 100;

    setScore(Math.round(totalScore));
    setBreakdown(metrics);

    // Determine trend (simplified - could use historical data)
    if (totalScore >= 70) {
      setTrend('improving');
    } else if (totalScore < 40) {
      setTrend('declining');
    } else {
      setTrend('neutral');
    }

    // Generate suggestions based on score
    generateSuggestions(metrics, totalScore);
  };

  const calculateCashFlowScore = (data) => {
    if (!data || !data.projected_balance) return 50;
    
    // Positive cash flow = higher score
    const balance = data.projected_balance;
    if (balance > 50000) return 100;
    if (balance > 20000) return 85;
    if (balance > 10000) return 70;
    if (balance > 5000) return 60;
    if (balance > 0) return 50;
    if (balance > -10000) return 30;
    return 10;
  };

  const calculateDebtScore = (debts, transactions) => {
    if (!debts || debts.length === 0) return 100;

    // Calculate monthly income from transactions
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyIncome = transactions
      ?.filter(t => t.type === 'ingreso' && new Date(t.date) >= monthStart)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

    if (monthlyIncome === 0) return 50;

    // Calculate total monthly debt payments
    const monthlyDebtPayments = debts
      .filter(d => d.status === 'active')
      .reduce((sum, d) => sum + parseFloat(d.monthly_payment || 0), 0);

    const debtToIncomeRatio = monthlyDebtPayments / monthlyIncome;

    // Score based on debt-to-income ratio
    if (debtToIncomeRatio < 0.15) return 100;
    if (debtToIncomeRatio < 0.28) return 80;
    if (debtToIncomeRatio < 0.36) return 60;
    if (debtToIncomeRatio < 0.43) return 40;
    return 20;
  };

  const calculateBudgetScore = (budgets) => {
    if (!budgets || budgets.length === 0) return 50;

    const activeBudgets = budgets.filter(b => b.status === 'active');
    if (activeBudgets.length === 0) return 50;

    // Calculate average budget adherence
    let totalAdherence = 0;
    activeBudgets.forEach(budget => {
      const spent = parseFloat(budget.spent || 0);
      const limit = parseFloat(budget.amount || 1);
      const percentage = (spent / limit) * 100;

      // Score: 100 if under budget, decreasing as over budget
      if (percentage <= 80) {
        totalAdherence += 100;
      } else if (percentage <= 100) {
        totalAdherence += 90;
      } else if (percentage <= 110) {
        totalAdherence += 70;
      } else if (percentage <= 125) {
        totalAdherence += 50;
      } else {
        totalAdherence += 20;
      }
    });

    return Math.round(totalAdherence / activeBudgets.length);
  };

  const calculateSavingsScore = (transactions) => {
    if (!transactions || transactions.length === 0) return 50;

    // Calculate current month income and savings
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTransactions = transactions.filter(t => new Date(t.date) >= monthStart);

    const income = monthTransactions
      .filter(t => t.type === 'ingreso')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'gasto')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    if (income === 0) return 50;

    const savings = income - expenses;
    const savingsRate = (savings / income) * 100;

    // Score based on savings rate
    if (savingsRate >= 20) return 100;
    if (savingsRate >= 15) return 90;
    if (savingsRate >= 10) return 75;
    if (savingsRate >= 5) return 60;
    if (savingsRate >= 0) return 50;
    return 20;
  };

  const calculateBalanceScore = (accounts) => {
    if (!accounts || accounts.length === 0) return 50;

    // Check if accounts have positive balances
    const positiveAccounts = accounts.filter(a => parseFloat(a.balance || 0) > 0).length;
    const totalAccounts = accounts.length;

    const ratio = positiveAccounts / totalAccounts;
    if (ratio >= 0.9) return 100;
    if (ratio >= 0.75) return 80;
    if (ratio >= 0.5) return 60;
    if (ratio >= 0.25) return 40;
    return 20;
  };

  const generateSuggestions = (metrics, totalScore) => {
    const newSuggestions = [];

    // Find weakest areas
    const sortedMetrics = [...metrics].sort((a, b) => a.score - b.score);
    const weakestMetric = sortedMetrics[0];

    if (weakestMetric.score < 50) {
      switch (weakestMetric.name) {
        case 'Salud de Flujo de Efectivo':
          newSuggestions.push('Revisa tus gastos recurrentes para mejorar tu flujo de efectivo');
          break;
        case 'Relación Deuda-Ingresos':
          newSuggestions.push('Considera consolidar deudas o aumentar tus pagos mensuales');
          break;
        case 'Adherencia al Presupuesto':
          newSuggestions.push('Ajusta tus presupuestos para reflejar tus gastos reales');
          break;
        case 'Tasa de Ahorro':
          newSuggestions.push('Intenta ahorrar al menos el 10% de tus ingresos mensuales');
          break;
        case 'Salud de Saldos':
          newSuggestions.push('Verifica cuentas con saldo bajo o negativo');
          break;
      }
    }

    if (totalScore < 40) {
      newSuggestions.push('Considera consultar con un asesor financiero');
    } else if (totalScore >= 70) {
      newSuggestions.push('¡Excelente! Mantén estos buenos hábitos financieros');
    }

    setSuggestions(newSuggestions);
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-success-600 dark:text-success-400';
    if (score >= 40) return 'text-warning-600 dark:text-warning-400';
    return 'text-danger-600 dark:text-danger-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 70) return 'bg-success-500';
    if (score >= 40) return 'bg-warning-500';
    return 'bg-danger-500';
  };

  const getTrendIcon = () => {
    if (trend === 'improving') return 'arrowTrendingUp';
    if (trend === 'declining') return 'arrowTrendingDown';
    return 'minus';
  };

  const getTrendColor = () => {
    if (trend === 'improving') return 'text-success-600';
    if (trend === 'declining') return 'text-danger-600';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-heading-4 font-semibold text-gray-900 dark:text-gray-100">
          Salud Financiera
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
        >
          {expanded ? 'Ver menos' : 'Ver detalles'}
          <Icon name={expanded ? 'chevronUp' : 'chevronDown'} size="sm" />
        </button>
      </div>

      {/* Score Display */}
      <div className="flex items-center gap-6 mb-6">
        {/* Progress Ring */}
        <div className="relative">
          <svg className="w-32 h-32 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-slate-700"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
              className={getScoreColor(score)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">de 100</div>
            </div>
          </div>
        </div>

        {/* Score Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score >= 70 ? 'Excelente' : score >= 40 ? 'Regular' : 'Necesita Atención'}
            </span>
            <Icon name={getTrendIcon()} size="md" className={getTrendColor()} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Tu puntaje de salud financiera refleja tu situación actual basada en métricas clave.
          </p>

          {/* Quick Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <Icon name="lightBulb" size="sm" className="text-warning-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Breakdown */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-slate-700 pt-6 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Desglose por Métrica
          </h4>
          {breakdown.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name={metric.icon} size="sm" className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {metric.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({metric.weight}%)
                  </span>
                </div>
                <span className={`text-sm font-semibold ${getScoreColor(metric.score)}`}>
                  {metric.score}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreBgColor(metric.score)}`}
                  style={{ width: `${metric.score}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {metric.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
