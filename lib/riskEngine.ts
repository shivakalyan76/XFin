import { BusinessInputs, DerivedMetrics, HealthScoreResult, Alert } from './types';
import { computeMetrics, forecastCashFlow, round2 } from './financialEngine';

/**
 * RISK / ANALYSIS ENGINE
 * ----------------------
 * Transparent, rule-based scoring. Every weight and threshold is a plain
 * constant defined below so it can be explained to a judge in one sentence.
 * No AI/ML is used to produce the score itself.
 */

const WEIGHTS = {
  profitability: 25,
  liquidity: 25,
  receivablesHealth: 20,
  debtLoad: 15,
  workingCapital: 15,
};

export function computeHealthScore(inputs: BusinessInputs): HealthScoreResult {
  const m = computeMetrics(inputs);
  const components: HealthScoreResult['components'] = [];

  // 1. Profitability (profit margin)
  let profitabilityScore = clamp(mapRange(m.profitMarginPct, -20, 30, 0, 100), 0, 100);
  components.push({
    label: 'Profitability',
    score: round2((profitabilityScore / 100) * WEIGHTS.profitability),
    weight: WEIGHTS.profitability,
    note: `Profit margin is ${m.profitMarginPct}%`,
  });

  // 2. Liquidity (cash vs monthly expenses -> months of buffer)
  const monthsOfCash = m.expenses > 0 ? m.cash / m.expenses : m.cash > 0 ? 3 : 0;
  let liquidityScore = clamp(mapRange(monthsOfCash, 0, 3, 0, 100), 0, 100);
  components.push({
    label: 'Liquidity',
    score: round2((liquidityScore / 100) * WEIGHTS.liquidity),
    weight: WEIGHTS.liquidity,
    note: `Cash covers ~${round2(monthsOfCash)} month(s) of expenses`,
  });

  // 3. Receivables health (lower days & lower receivables/revenue ratio = better)
  const receivableRatio = m.revenue > 0 ? m.receivables / m.revenue : 0;
  let receivablesScore = clamp(
    100 - mapRange(inputs.avgReceivableDays, 15, 90, 0, 60) - mapRange(receivableRatio, 0, 2, 0, 40),
    0,
    100
  );
  components.push({
    label: 'Receivables Health',
    score: round2((receivablesScore / 100) * WEIGHTS.receivablesHealth),
    weight: WEIGHTS.receivablesHealth,
    note: `Avg collection time ${inputs.avgReceivableDays} days`,
  });

  // 4. Debt load (EMI as % of profit)
  const emiToProfitRatio = m.profit > 0 ? m.emi / m.profit : m.emi > 0 ? 2 : 0;
  let debtScore = clamp(100 - mapRange(emiToProfitRatio, 0, 1, 0, 100), 0, 100);
  components.push({
    label: 'Debt Load',
    score: round2((debtScore / 100) * WEIGHTS.debtLoad),
    weight: WEIGHTS.debtLoad,
    note: `EMI is ${m.profit > 0 ? round2(emiToProfitRatio * 100) : 'N/A'}% of monthly profit`,
  });

  // 5. Working capital (positive and reasonable = healthy)
  const wcRatio = m.revenue > 0 ? m.workingCapital / m.revenue : 0;
  let wcScore = clamp(mapRange(wcRatio, -0.5, 1, 0, 100), 0, 100);
  components.push({
    label: 'Working Capital',
    score: round2((wcScore / 100) * WEIGHTS.workingCapital),
    weight: WEIGHTS.workingCapital,
    note: `Working capital is ₹${m.workingCapital.toLocaleString('en-IN')}`,
  });

  const total = round2(components.reduce((sum, c) => sum + c.score, 0));

  let band: HealthScoreResult['band'];
  if (total >= 80) band = 'Excellent';
  else if (total >= 65) band = 'Good';
  else if (total >= 45) band = 'Fair';
  else if (total >= 25) band = 'Weak';
  else band = 'Critical';

  return { score: total, band, components };
}

export function generateAlerts(inputs: BusinessInputs): Alert[] {
  const m = computeMetrics(inputs);
  const alerts: Alert[] = [];
  const monthsOfCash = m.expenses > 0 ? m.cash / m.expenses : m.cash > 0 ? 99 : 0;

  if (monthsOfCash < 1) {
    alerts.push({
      id: 'low-cash',
      severity: 'critical',
      title: 'Cash runway under 1 month',
      detail: `At current burn, cash covers only ${round2(monthsOfCash)} month(s) of expenses.`,
    });
  } else if (monthsOfCash < 2) {
    alerts.push({
      id: 'thin-cash',
      severity: 'warning',
      title: 'Thin cash buffer',
      detail: `Cash covers ${round2(monthsOfCash)} months of expenses. Aim for 2-3 months.`,
    });
  }

  if (m.profit < 0) {
    alerts.push({
      id: 'negative-profit',
      severity: 'critical',
      title: 'Operating at a loss',
      detail: `Monthly expenses exceed revenue by ₹${Math.abs(m.profit).toLocaleString('en-IN')}.`,
    });
  }

  if (inputs.avgReceivableDays > 60) {
    alerts.push({
      id: 'slow-collections',
      severity: 'warning',
      title: 'Slow customer payments',
      detail: `Customers take ${inputs.avgReceivableDays} days on average to pay. Cash is stuck in receivables.`,
    });
  }

  if (m.receivables > m.revenue * 1.5 && m.revenue > 0) {
    alerts.push({
      id: 'receivables-pileup',
      severity: 'warning',
      title: 'Receivables piling up',
      detail: `Outstanding receivables (₹${m.receivables.toLocaleString('en-IN')}) exceed 1.5x monthly revenue.`,
    });
  }

  if (m.profit > 0 && monthsOfCash < 1.5) {
    alerts.push({
      id: 'profitable-but-cash-poor',
      severity: 'info',
      title: 'Profitable but cash-constrained',
      detail: `You're profitable on paper, but cash is tied up in receivables/inventory rather than sitting in the bank.`,
    });
  }

  if (m.emi > 0 && m.profit > 0 && m.emi / m.profit > 0.5) {
    alerts.push({
      id: 'high-debt-service',
      severity: 'warning',
      title: 'High debt servicing burden',
      detail: `EMI consumes more than 50% of monthly profit (₹${m.emi.toLocaleString('en-IN')}/mo).`,
    });
  }

  if (inputs.monthlyInventoryTurnoverDays > 60) {
    alerts.push({
      id: 'slow-inventory',
      severity: 'info',
      title: 'Inventory moving slowly',
      detail: `Inventory takes ~${inputs.monthlyInventoryTurnoverDays} days to turn over. Cash is sitting on shelves.`,
    });
  }

  const forecast = forecastCashFlow(inputs, 6);
  const willGoNegative = forecast.find((f) => f.cumulativeCash < 0);
  if (willGoNegative) {
    alerts.push({
      id: 'forecast-negative',
      severity: 'critical',
      title: `Cash projected to go negative in ${willGoNegative.month}`,
      detail: `Based on current trends, cumulative cash turns negative in ${willGoNegative.month} of the 6-month forecast.`,
    });
  }

  return alerts;
}

export function analyzeReceivables(inputs: BusinessInputs) {
  const m = computeMetrics(inputs);
  const dso = inputs.avgReceivableDays; // Days Sales Outstanding
  // Estimate cash locked due to collection period (strictly capped at actual accounts receivable)
  const excessDsoRatio = dso > 30 ? Math.min(1, (dso - 30) / dso) : 0;
  const rawEstimate = excessDsoRatio > 0 ? m.receivables * (excessDsoRatio + 0.2) : m.receivables * 0.25;
  const cashStuckEstimate = m.receivables > 0 ? round2(Math.min(m.receivables, rawEstimate)) : 0;

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (dso > 60) riskLevel = 'high';
  else if (dso > 30) riskLevel = 'medium';

  return {
    receivables: m.receivables,
    avgReceivableDays: dso,
    receivableToRevenueRatio: m.revenue > 0 ? round2(m.receivables / m.revenue) : 0,
    riskLevel,
    estimatedCashStuck: cashStuckEstimate,
  };
}

export function analyzeInventory(inputs: BusinessInputs) {
  const m = computeMetrics(inputs);
  const turnoverDays = inputs.monthlyInventoryTurnoverDays;
  const inventoryToRevenueRatio = m.revenue > 0 ? round2(m.inventory / m.revenue) : 0;
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (turnoverDays > 60) riskLevel = 'high';
  else if (turnoverDays > 30) riskLevel = 'medium';

  return {
    inventoryValue: m.inventory,
    turnoverDays,
    inventoryToRevenueRatio,
    riskLevel,
  };
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
