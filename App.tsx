import React, { useState, useEffect, useCallback } from 'react';
import { AppState, CalculationResult, Stage, ProfitScenario, StageCostDetail, Feed } from './types';
import { INITIAL_STAGES, BAG_WEIGHT, AVERAGE_DAILY_GAIN } from './constants';
import Header from './components/Header';
import InputCard from './components/InputCard';
import FeedStageCard from './components/FeedStageCard';
import ResultsCard from './components/ResultsCard';
import Footer from './components/Footer';

function App() {
  const [startWeight, setStartWeight] = useState<number>(7);
  const [targetWeight, setTargetWeight] = useState<number>(100);
  const [geneticPrice, setGeneticPrice] = useState<number>(1200000);
  const [medicineCost, setMedicineCost] = useState<number>(50000);
  const [managementCost, setManagementCost] = useState<number>(50000);
  const [forecastedHogPrice, setForecastedHogPrice] = useState<number>(55000);
  const [stages, setStages] = useState<Stage[]>(INITIAL_STAGES);
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const handleStageChange = useCallback((index: number, updatedStage: Stage) => {
    const newStages = [...stages];
    newStages[index] = updatedStage;
    setStages(newStages);
  }, [stages]);

  const calculateCosts = useCallback(() => {
    const isProjectionMode = stages.some(s => s.feeds.some(f => f.bagsConsumed > 0));
    const totalOtherCosts = geneticPrice + medicineCost + managementCost;
    
    const scenarios = [
        { name: 'Bi quan (-5%)', multiplier: 0.95 },
        { name: 'Dự kiến', multiplier: 1.0 },
        { name: 'Lạc quan (+5%)', multiplier: 1.05 },
    ];

    const calculateProfitScenarios = (finalWeight: number, totalCost: number): ProfitScenario[] => {
      return scenarios.map(s => {
        const hogPrice = forecastedHogPrice * s.multiplier;
        const revenue = finalWeight * hogPrice;
        const profit = revenue - totalCost;
        return {
            scenario: s.name,
            hogPrice: parseFloat(hogPrice.toFixed(2)),
            revenue: parseFloat(revenue.toFixed(2)),
            profit: parseFloat(profit.toFixed(2)),
        };
      });
    }

    let totalFeedCost = 0;
    let totalFeedConsumed = 0;
    let totalWeightGain = 0;
    const stageCosts: StageCostDetail[] = [];

    if (isProjectionMode) {
      // --- PROJECTION MODE ---
      stages.forEach(stage => {
        stage.feeds.forEach(feed => {
          let feedConsumedForStage = 0;
          let costForStage = 0;
          let weightGainForStage = 0;

          if (feed.bagsConsumed > 0) {
            feedConsumedForStage = feed.bagsConsumed * BAG_WEIGHT;
            costForStage = feed.bagsConsumed * feed.pricePerBag;
            if (feed.fcr > 0) {
              weightGainForStage = feedConsumedForStage / feed.fcr;
            }
          }
          
          totalFeedConsumed += feedConsumedForStage;
          totalFeedCost += costForStage;
          totalWeightGain += weightGainForStage;
          if (costForStage > 0) {
            stageCosts.push({ 
              name: stage.name, 
              cost: parseFloat(costForStage.toFixed(2)), 
              feed: feed.productCode,
              feedKg: parseFloat(feedConsumedForStage.toFixed(2)),
              pricePerBag: feed.pricePerBag,
            });
          }
        });
      });
      
      const totalCost = totalFeedCost + totalOtherCosts;
      const projectedFinalWeight = startWeight + totalWeightGain;
      const costPerKgLiveWeight = projectedFinalWeight > 0 ? totalCost / projectedFinalWeight : 0;
      const numberOfDays = totalWeightGain > 0 ? totalWeightGain / AVERAGE_DAILY_GAIN : 0;
      const feedCostPerKgGain = totalWeightGain > 0 ? totalFeedCost / totalWeightGain : 0;
      const profitScenarios = calculateProfitScenarios(projectedFinalWeight, totalCost);

      setResults({
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalFeedCost: parseFloat(totalFeedCost.toFixed(2)),
        totalOtherCosts: parseFloat(totalOtherCosts.toFixed(2)),
        costPerKgLiveWeight: parseFloat(costPerKgLiveWeight.toFixed(2)),
        totalFeedConsumed: parseFloat(totalFeedConsumed.toFixed(2)),
        totalWeightGain: parseFloat(totalWeightGain.toFixed(2)),
        projectedFinalWeight: parseFloat(projectedFinalWeight.toFixed(2)),
        stageCosts,
        calculationMode: 'projection',
        profitScenarios,
        geneticPrice: geneticPrice,
        medicineCost: medicineCost,
        managementCost: managementCost,
        numberOfDays: parseFloat(numberOfDays.toFixed(0)),
        feedCostPerKgGain: parseFloat(feedCostPerKgGain.toFixed(2)),
      });

    } else {
      // --- FORECAST MODE ---
      const effectiveStartWeight = Math.max(startWeight, stages[0].startWeight);

      stages.forEach((stage, index) => {
        // In forecast mode, we only use the first feed of each stage for calculation.
        const primaryFeed = stage.feeds[0];
        if (!primaryFeed) return;

        const stageStart = index === 0 ? effectiveStartWeight : stage.startWeight;
        const stageEnd = Math.min(stage.endWeight, targetWeight);

        if (stageStart >= stageEnd) return;

        const weightGainInStage = stageEnd - stageStart;
        let feedConsumed = 0;
        let costForStage = 0;

        if (weightGainInStage > 0) {
          const pricePerBag = primaryFeed.pricePerBag;
          const fcr = primaryFeed.fcr;
          feedConsumed = weightGainInStage * fcr;
          const pricePerKgFeed = pricePerBag / BAG_WEIGHT;
          costForStage = feedConsumed * pricePerKgFeed;
        }
        
        totalFeedCost += costForStage;
        totalFeedConsumed += feedConsumed;
        totalWeightGain += weightGainInStage;
        
        if (costForStage > 0) {
          stageCosts.push({ 
            name: stage.name, 
            cost: parseFloat(costForStage.toFixed(2)), 
            feed: primaryFeed.productCode,
            feedKg: parseFloat(feedConsumed.toFixed(2)),
            pricePerBag: primaryFeed.pricePerBag,
          });
        }
      });
      
      const totalCost = totalFeedCost + totalOtherCosts;
      const costPerKgLiveWeight = targetWeight > 0 ? totalCost / targetWeight : 0;
      const numberOfDays = totalWeightGain > 0 ? totalWeightGain / AVERAGE_DAILY_GAIN : 0;
      const feedCostPerKgGain = totalWeightGain > 0 ? totalFeedCost / totalWeightGain : 0;
      const profitScenarios = calculateProfitScenarios(targetWeight, totalCost);

      setResults({
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalFeedCost: parseFloat(totalFeedCost.toFixed(2)),
        totalOtherCosts: parseFloat(totalOtherCosts.toFixed(2)),
        costPerKgLiveWeight: parseFloat(costPerKgLiveWeight.toFixed(2)),
        totalFeedConsumed: parseFloat(totalFeedConsumed.toFixed(2)),
        totalWeightGain: parseFloat(totalWeightGain.toFixed(2)),
        stageCosts,
        calculationMode: 'forecast',
        profitScenarios,
        geneticPrice: geneticPrice,
        medicineCost: medicineCost,
        managementCost: managementCost,
        numberOfDays: parseFloat(numberOfDays.toFixed(0)),
        feedCostPerKgGain: parseFloat(feedCostPerKgGain.toFixed(2)),
      });
    }
  }, [startWeight, targetWeight, stages, geneticPrice, medicineCost, managementCost, forecastedHogPrice]);

  const saveState = (): AppState => ({ 
    startWeight, 
    targetWeight, 
    stages,
    geneticPrice,
    medicineCost,
    managementCost,
    forecastedHogPrice,
  });

  const loadState = (newState: AppState) => {
    setStartWeight(newState.startWeight || 7);
    setTargetWeight(newState.targetWeight || 100);
    setGeneticPrice(newState.geneticPrice || 1200000);
    setMedicineCost(newState.medicineCost || 50000);
    setManagementCost(newState.managementCost || 50000);
    setForecastedHogPrice(newState.forecastedHogPrice || 55000);
    // Ensure loaded stages conform to the new data structure
    const loadedStages = (newState.stages || INITIAL_STAGES).map(s => ({ 
        ...s, 
        feeds: (s.feeds && s.feeds.length > 0) 
            ? s.feeds.map(f => ({ ...f, id: f.id || crypto.randomUUID(), bagsConsumed: f.bagsConsumed || 0 }))
            // Fallback for old data structure
            : [{ 
                id: crypto.randomUUID(),
                productCode: (s as any).productCode || '',
                pricePerBag: (s as any).pricePerBag || 0,
                fcr: (s as any).fcr || 0,
                bagsConsumed: (s as any).bagsConsumed || 0
            }]
    }));
    setStages(loadedStages);
  };

  useEffect(() => {
    try {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const decodedState = JSON.parse(atob(hash));
        loadState(decodedState);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        window.location.hash = '';
      }
    } catch (error)
 {
      console.error("Failed to load state from URL", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6">
        {showNotification && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md shadow-md" role="alert">
            <p className="font-bold">Thành công</p>
            <p>Tính toán của bạn đã được tải từ liên kết chia sẻ.</p>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <InputCard 
              startWeight={startWeight}
              setStartWeight={setStartWeight}
              targetWeight={targetWeight}
              setTargetWeight={setTargetWeight}
              geneticPrice={geneticPrice}
              setGeneticPrice={setGeneticPrice}
              medicineCost={medicineCost}
              setMedicineCost={setMedicineCost}
              managementCost={managementCost}
              setManagementCost={setManagementCost}
              forecastedHogPrice={forecastedHogPrice}
              setForecastedHogPrice={setForecastedHogPrice}
            />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">Giai đoạn cho ăn</h2>
              <div className="space-y-4">
                {stages.map((stage, index) => (
                  <FeedStageCard 
                    key={index}
                    stage={stage}
                    onChange={(updatedStage) => handleStageChange(index, updatedStage)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
            <button
                onClick={calculateCosts}
                className="w-full sm:w-auto inline-flex justify-center items-center px-12 py-4 border border-transparent text-lg font-bold rounded-lg shadow-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-105"
            >
                Tính toán & Xem kết quả
            </button>
        </div>

        {results && (
          <div className="mt-6">
            <ResultsCard results={results} getStateToShare={saveState} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;