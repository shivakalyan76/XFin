import { BusinessInputs, WhatIfResult } from './types';
import { computeMetrics, forecastCashFlow, computeFundingRequirement } from './financialEngine';
import { computeHealthScore, generateAlerts, analyzeReceivables, analyzeInventory } from './riskEngine';

/** Bundles every already-computed number the AI advisor is allowed to reference. */
export function buildAdvisorContext(business: BusinessInputs, whatIf?: WhatIfResult) {
  const metrics = computeMetrics(business);
  const health = computeHealthScore(business);
  const alerts = generateAlerts(business);
  const funding = computeFundingRequirement(business);
  const receivables = analyzeReceivables(business);
  const inventory = analyzeInventory(business);
  const forecast = forecastCashFlow(business, 6);

  return {
    business: {
      name: business.businessName,
      industry: business.industry,
      monthsInBusiness: business.monthsInBusiness,
    },
    metrics,
    healthScore: health,
    alerts,
    fundingRequirement: funding,
    receivablesAnalysis: receivables,
    inventoryAnalysis: inventory,
    sixMonthForecast: forecast,
    whatIfComparison: whatIf ?? null,
  };
}
