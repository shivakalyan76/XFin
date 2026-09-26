import { BusinessInputs } from './types';

// A realistic Indian micro-entrepreneur demo profile (small manufacturing/trading business)
export const DEMO_BUSINESS: BusinessInputs = {
  businessName: 'Shree Ganesh Textiles',
  industry: 'Textile Trading',
  monthlyRevenue: 450000,
  monthlyExpenses: 380000,
  cashOnHand: 220000,
  accountsReceivable: 310000,
  avgReceivableDays: 42,
  accountsPayable: 150000,
  avgPayableDays: 30,
  inventoryValue: 280000,
  monthlyInventoryTurnoverDays: 45,
  outstandingDebt: 600000,
  debtInterestRatePct: 14,
  debtTenureMonths: 24,
  monthsInBusiness: 18,
};

export const EMPTY_BUSINESS: BusinessInputs = {
  businessName: '',
  industry: '',
  monthlyRevenue: 0,
  monthlyExpenses: 0,
  cashOnHand: 0,
  accountsReceivable: 0,
  avgReceivableDays: 30,
  accountsPayable: 0,
  avgPayableDays: 30,
  inventoryValue: 0,
  monthlyInventoryTurnoverDays: 30,
  outstandingDebt: 0,
  debtInterestRatePct: 0,
  debtTenureMonths: 0,
  monthsInBusiness: 0,
};
