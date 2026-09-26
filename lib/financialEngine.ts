import { BusinessInputs, DerivedMetrics, CashFlowMonth, WhatIfScenarioInput } from './types';

/**
 * FINANCIAL ENGINE
 * ----------------
 * Every number here is computed with plain deterministic arithmetic.
 * Claude / any AI model NEVER computes these values - it only explains
 * them after they've been calculated here. This file has zero AI calls.
 */

export function computeMetrics(inputs: BusinessInputs): DerivedMetrics {
  const revenue = round2(inputs.monthlyRevenue);
  const expenses = round2(inputs.monthlyExpenses);
  const profit = round2(revenue - expenses);
  const profitMarginPct = revenue > 0 ? round2((profit / revenue) * 100) : 0;

  const cash = round2(inputs.cashOnHand);
  const receivables = round2(inputs.accountsReceivable);
  const payables = round2(inputs.accountsPayable);
  const inventory = round2(inputs.inventoryValue);
  const debt = round2(inputs.outstandingDebt);

  const emi = computeEMI(debt, inputs.debtInterestRatePct, inputs.debtTenureMonths);
  const workingCapital = round2(receivables + inventory - payables);
  const netCashPosition = round2(cash - payables);

  // Runway: if monthly net operating cash flow (profit - emi) is negative,
  // estimate months until cash on hand is depleted.
  const monthlyNetCash = profit - emi;
  const burnMonths =
    monthlyNetCash < 0 && cash > 0 ? round2(cash / Math.abs(monthlyNetCash)) : monthlyNetCash < 0 ? 0 : null;

  return {
    revenue,
    expenses,
    profit,
    profitMarginPct,
    cash,
    receivables,
    payables,
    inventory,
    debt,
    emi,
    workingCapital,
    netCashPosition,
    burnMonths,
  };
}

/** Standard reducing-balance EMI formula. Returns 0 if there is no debt. */
export function computeEMI(principal: number, annualRatePct: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return round2(principal / tenureMonths);
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return round2(emi);
}

/**
 * Builds an N-month cash flow forecast from current inputs.
 * Realistic rolling working-capital collection model:
 *  - Revenue not collected in Month N rolls into subsequent months rather than disappearing.
 *  - Existing opening receivables (from balance sheet) are collected over the initial collection cycle.
 *  - Steady-state monthly inflow matches monthly revenue once collection lag stabilizes.
 *  - Outflow = monthly operating expenses + EMI, plus any Month 1 one-time Capex / inventory delta.
 */
export function forecastCashFlow(
  inputs: BusinessInputs,
  months = 6,
  overrides?: {
    revenueMultiplier?: number;
    extraReceivableDays?: number;
    oneTimeCapexMonth1?: number;
    oneTimeFinancingMonth1?: number;
    extraEmi?: number;
    inventoryDelta?: number;
  }
): CashFlowMonth[] {
  const metrics = computeMetrics(inputs);
  const revenueMultiplier = overrides?.revenueMultiplier ?? 1;
  const extraReceivableDays = overrides?.extraReceivableDays ?? 0;
  const effectiveDSO = Math.max(1, inputs.avgReceivableDays + extraReceivableDays);

  // Fraction of current month's sales collected within the same 30-day month
  const inMonthCollectionRate = Math.min(1, 30 / Math.max(30, effectiveDSO));

  // Rate at which opening balance sheet receivables are collected
  const openingDSO = Math.max(1, inputs.avgReceivableDays);
  const openingCollectionRate = Math.min(1, 30 / Math.max(30, openingDSO));
  let remainingOpeningAR = inputs.accountsReceivable;

  let pendingDeferredRevenue = 0;
  let cumulativeCash = metrics.cash;
  const result: CashFlowMonth[] = [];

  for (let i = 1; i <= months; i++) {
    const monthlyRevenue = round2(metrics.revenue * revenueMultiplier);

    // 1. Cash collected from current month's sales
    const inMonthSalesCollected = round2(monthlyRevenue * inMonthCollectionRate);

    // 2. Uncollected portion of current month's sales that rolls into next month
    const deferredFromThisMonth = round2(monthlyRevenue - inMonthSalesCollected);

    // 3. Cash collected from previous month's deferred sales rolling in
    const collectedFromPriorSales = pendingDeferredRevenue;

    // 4. Cash collected from opening balance sheet receivables
    let openingARCollected = 0;
    if (remainingOpeningAR > 0) {
      openingARCollected = round2(
        Math.min(remainingOpeningAR, inputs.accountsReceivable * openingCollectionRate)
      );
      remainingOpeningAR = round2(remainingOpeningAR - openingARCollected);
      if (remainingOpeningAR < 0.01) remainingOpeningAR = 0;
    }

    // Pass this month's deferred sales to roll into next month
    pendingDeferredRevenue = deferredFromThisMonth;

    // Total monthly inflow
    const oneTimeFinancing = i === 1 ? overrides?.oneTimeFinancingMonth1 ?? 0 : 0;
    const inflow = round2(
      inMonthSalesCollected + collectedFromPriorSales + openingARCollected + oneTimeFinancing
    );

    // Monthly outflow
    let outflow = metrics.expenses + metrics.emi + (overrides?.extraEmi ?? 0);
    if (i === 1) outflow += overrides?.oneTimeCapexMonth1 ?? 0;
    if (i === 1 && overrides?.inventoryDelta) outflow += overrides.inventoryDelta;
    outflow = round2(outflow);

    const netCash = round2(inflow - outflow);
    cumulativeCash = round2(cumulativeCash + netCash);

    result.push({
      month: `M${i}`,
      inflow,
      outflow,
      netCash,
      cumulativeCash,
    });
  }

  return result;
}

/** Funding requirement: how much cash is needed to keep cumulative cash >= safety buffer over the forecast window. */
export function computeFundingRequirement(
  inputs: BusinessInputs,
  months = 6,
  safetyBufferMonths = 1
): { requiredFunding: number; lowestPoint: number; safetyBuffer: number } {
  const metrics = computeMetrics(inputs);
  const safetyBuffer = round2(metrics.expenses * safetyBufferMonths);
  const forecast = forecastCashFlow(inputs, months);
  const lowestPoint = Math.min(...forecast.map((f) => f.cumulativeCash));
  const shortfall = safetyBuffer - lowestPoint;
  const requiredFunding = shortfall > 0 ? round2(shortfall) : 0;
  return { requiredFunding, lowestPoint: round2(lowestPoint), safetyBuffer };
}

export function applyWhatIf(inputs: BusinessInputs, scenario: WhatIfScenarioInput): BusinessInputs {
  const next: BusinessInputs = { ...inputs };

  if (scenario.salesChangePct) {
    next.monthlyRevenue = round2(inputs.monthlyRevenue * (1 + scenario.salesChangePct / 100));
  }
  if (scenario.extraLatePaymentDays) {
    next.avgReceivableDays = inputs.avgReceivableDays + scenario.extraLatePaymentDays;
  }
  if (scenario.machinePurchase) {
    next.cashOnHand = round2(inputs.cashOnHand - scenario.machinePurchase);
  }
  if (scenario.newFinancing) {
    next.cashOnHand = round2((next.cashOnHand ?? inputs.cashOnHand) + scenario.newFinancing);
    next.outstandingDebt = round2(inputs.outstandingDebt + scenario.newFinancing);
    if (scenario.newFinancingRatePct) next.debtInterestRatePct = scenario.newFinancingRatePct;
    if (scenario.newFinancingTenureMonths) next.debtTenureMonths = scenario.newFinancingTenureMonths;
  }
  if (scenario.inventoryIncrease) {
    next.inventoryValue = round2(inputs.inventoryValue + scenario.inventoryIncrease);
    next.cashOnHand = round2((next.cashOnHand ?? inputs.cashOnHand) - scenario.inventoryIncrease);
  }

  return next;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
