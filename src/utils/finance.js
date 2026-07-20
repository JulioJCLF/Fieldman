/**
 * Financial calculation utilities for analytics and forecasting
 */

/**
 * Simple linear regression for forecasting
 * @param {number[]} data - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @returns {{ forecast: number[], slope: number, intercept: number, r2: number }}
 */
export function linearRegression(data, periods = 3) {
  const n = data.length;
  if (n < 2) return { forecast: Array(periods).fill(0), slope: 0, intercept: 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
    sumY2 += data[i] * data[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R² calculation
  const ssRes = data.reduce((sum, y, i) => sum + Math.pow(y - (slope * i + intercept), 2), 0);
  const ssTot = data.reduce((sum, y) => sum + Math.pow(y - (sumY / n), 2), 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  const forecast = [];
  for (let i = 0; i < periods; i++) {
    forecast.push(Math.max(0, Math.round(slope * (n + i) + intercept)));
  }

  return { forecast, slope, intercept, r2 };
}

/**
 * Calculate moving average
 * @param {number[]} data
 * @param {number} window - Window size
 * @returns {number[]}
 */
export function movingAverage(data, window = 3) {
  if (data.length < window) return data;
  const result = [];
  for (let i = 0; i <= data.length - window; i++) {
    const slice = data.slice(i, i + window);
    result.push(Math.round(slice.reduce((a, b) => a + b, 0) / window));
  }
  return result;
}

/**
 * Calculate profit margin
 * @param {number} revenue
 * @param {number} costs
 * @returns {number} Margin percentage
 */
export function profitMargin(revenue, costs) {
  if (revenue === 0) return 0;
  return ((revenue - costs) / revenue) * 100;
}

/**
 * Calculate break-even point
 * @param {number} fixedCosts - Total fixed costs per period
 * @param {number} pricePerUnit - Revenue per game/player
 * @param {number} variableCostPerUnit - Variable cost per game/player
 * @returns {number} Number of units needed to break even
 */
export function breakEvenPoint(fixedCosts, pricePerUnit, variableCostPerUnit) {
  const contribution = pricePerUnit - variableCostPerUnit;
  if (contribution <= 0) return Infinity;
  return Math.ceil(fixedCosts / contribution);
}

/**
 * Group financial data by month
 * @param {Array} items - Items with date and amount fields
 * @param {string} dateField - Name of the date field
 * @param {string} amountField - Name of the amount field
 * @param {number} monthsBack - Number of months to look back
 * @returns {{ labels: string[], values: number[] }}
 */
export function groupByMonth(items, dateField = 'date', amountField = 'amount', monthsBack = 6) {
  const now = new Date();
  const labels = [];
  const values = [];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    labels.push(`${monthNames[month]} ${year}`);

    const total = items
      .filter((item) => {
        const itemDate = new Date(item[dateField]);
        return itemDate.getMonth() === month && itemDate.getFullYear() === year;
      })
      .reduce((sum, item) => sum + (item[amountField] || 0), 0);

    values.push(total);
  }

  return { labels, values };
}

/**
 * Group items by a category field and sum amounts
 * @param {Array} items
 * @param {string} categoryField
 * @param {string} amountField
 * @returns {{ labels: string[], values: number[] }}
 */
export function groupByCategory(items, categoryField = 'category', amountField = 'amount') {
  const groups = {};
  items.forEach((item) => {
    const cat = item[categoryField] || 'Other';
    groups[cat] = (groups[cat] || 0) + (item[amountField] || 0);
  });

  const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  return {
    labels: sorted.map(([label]) => label),
    values: sorted.map(([, value]) => value),
  };
}

/**
 * Calculate growth rate
 * @param {number} current
 * @param {number} previous
 * @returns {number} Growth percentage
 */
export function growthRate(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * What-if scenario calculation
 * @param {Object} params
 * @returns {Object} Projected results
 */
export function whatIfScenario({ 
  currentRevenue, 
  currentExpenses, 
  priceChange = 0, 
  capacityChange = 0, 
  gamesPerMonth = 0,
  avgPlayersPerGame = 0 
}) {
  const newPrice = currentRevenue / (gamesPerMonth * avgPlayersPerGame || 1) * (1 + priceChange / 100);
  const newCapacity = avgPlayersPerGame * (1 + capacityChange / 100);
  const projectedRevenue = newPrice * newCapacity * gamesPerMonth;
  const projectedProfit = projectedRevenue - currentExpenses;
  const projectedMargin = profitMargin(projectedRevenue, currentExpenses);

  return {
    projectedRevenue,
    projectedProfit,
    projectedMargin,
    revenueChange: growthRate(projectedRevenue, currentRevenue),
  };
}

/**
 * Detect seasonal trends
 * @param {Array} monthlyData - 12 months of data
 * @returns {{ peakMonths: number[], lowMonths: number[], seasonalIndex: number[] }}
 */
export function detectSeasonality(monthlyData) {
  if (monthlyData.length < 12) return { peakMonths: [], lowMonths: [], seasonalIndex: [] };

  const avg = monthlyData.reduce((a, b) => a + b, 0) / monthlyData.length;
  const seasonalIndex = monthlyData.map((v) => (avg === 0 ? 1 : v / avg));

  const peakMonths = seasonalIndex
    .map((v, i) => ({ index: i, value: v }))
    .filter((m) => m.value > 1.15)
    .map((m) => m.index);

  const lowMonths = seasonalIndex
    .map((v, i) => ({ index: i, value: v }))
    .filter((m) => m.value < 0.85)
    .map((m) => m.index);

  return { peakMonths, lowMonths, seasonalIndex };
}
