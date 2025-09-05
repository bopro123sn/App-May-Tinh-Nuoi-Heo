import { Stage } from './types';

export const BAG_WEIGHT = 25; // Standard bag weight in kg
export const AVERAGE_DAILY_GAIN = 0.8; // Average Daily Gain in kg/day, a common benchmark

export const INITIAL_STAGES: Stage[] = [
  { 
    name: 'Heo con', 
    startWeight: 7, 
    endWeight: 25, 
    feeds: [{ id: '1', productCode: 'W-Standard', pricePerBag: 625000, fcr: 1.6, bagsConsumed: 0 }]
  },
  { 
    name: 'Heo lứa', 
    startWeight: 25, 
    endWeight: 60, 
    feeds: [{ id: '2', productCode: 'G-Standard', pricePerBag: 550000, fcr: 2.2, bagsConsumed: 0 }]
  },
  { 
    name: 'Heo vỗ béo', 
    startWeight: 60, 
    endWeight: 100, 
    feeds: [{ id: '3', productCode: 'F-Standard', pricePerBag: 500000, fcr: 2.8, bagsConsumed: 0 }]
  },
];
