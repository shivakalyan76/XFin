// Core shape of a business's raw inputs. This is the ONLY thing a user edits.
// Everything else (metrics, scores, forecasts) is DERIVED deterministically
// from this object by financialEngine.ts / riskEngine.ts.

export interface BusinessInputs {
  businessName: string;
  industry: string;

  // Monthly revenue & expenses
  monthlyRevenue: number;
  monthlyExpenses: number;

  // Balance sheet style figures (current snapshot)
  cashOnHand: number;
  accountsReceivable: number; // money owed to you by customers
  avgReceivableDays: number; // average days customers take to pay
  accountsPayable: number; // money you owe suppliers
  avgPayableDays: number;

  inventoryValue: number;
  monthlyInventoryTurnoverDays: number; // avg days inventory sits before selling

  // Debt
  outstandingDebt: number;
  debtInterestRatePct: number; // annual %
  debtTenureMonths: number;

  // Meta
  monthsInBusiness: number;
}

export interface DerivedMetrics {
  revenue: number;
  expenses: number;
  profit: number;
  profitMarginPct: number;

  cash: number;
  receivables: number;
  payables: number;
  inventory: number;
  debt: number;

  emi: number; // estimated monthly EMI on outstanding debt
  workingCapital: number; // (receivables + inventory) - payables
  netCashPosition: number; // cash - payables due soon
  burnMonths: number | null; // months of runway at current burn, null if not burning
}

export interface HealthScoreResult {
  score: number; // 0-100
  band: 'Excellent' | 'Good' | 'Fair' | 'Weak' | 'Critical';
  components: { label: string; score: number; weight: number; note: string }[];
}

export interface CashFlowMonth {
  month: string;
  inflow: number;
  outflow: number;
  netCash: number;
  cumulativeCash: number;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
}

export interface WhatIfScenarioInput {
  salesChangePct?: number; // e.g. -20 for 20% decrease
  extraLatePaymentDays?: number; // e.g. 30
  machinePurchase?: number; // one-time capex
  newFinancing?: number; // one-time cash inflow (loan)
  newFinancingRatePct?: number;
  newFinancingTenureMonths?: number;
  inventoryIncrease?: number;
}

export interface WhatIfResult {
  baseline: DerivedMetrics;
  scenario: DerivedMetrics;
  cashDeltaMonth1: number;
  verdict: string;
  forecastBaseline: CashFlowMonth[];
  forecastScenario: CashFlowMonth[];
}
