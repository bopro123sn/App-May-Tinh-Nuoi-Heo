// types.ts

export interface Feed {
  id: string;
  productCode: string;
  pricePerBag: number;
  fcr: number;
  bagsConsumed: number;
}

export interface Stage {
  name: string;
  startWeight: number;
  endWeight: number;
  feeds: Feed[];
}

export interface ProfitScenario {
  scenario: string;
  hogPrice: number;
  revenue: number;
  profit: number;
}

export interface StageCostDetail {
  name: string;
  cost: number;
  feed: string;
  feedKg: number;
  pricePerBag: number;
}

export interface CalculationResult {
  totalCost: number;
  totalFeedCost: number;
  totalOtherCosts: number;
  costPerKgLiveWeight: number;
  totalFeedConsumed: number;
  totalWeightGain: number;
  stageCosts: StageCostDetail[];
  projectedFinalWeight?: number;
  calculationMode: 'forecast' | 'projection';
  profitScenarios: ProfitScenario[];
  geneticPrice: number;
  medicineCost: number;
  managementCost: number;
  numberOfDays: number;
  feedCostPerKgGain: number;
}

export interface AppState {
  startWeight: number;
  targetWeight: number;
  stages: Stage[];
  geneticPrice: number;
  medicineCost: number;
  managementCost: number;
  forecastedHogPrice: number;
}
