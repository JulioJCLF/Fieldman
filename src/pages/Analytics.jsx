import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { formatCurrency } from '../utils/constants';
import { 
  linearRegression, 
  groupByMonth, 
  groupByCategory, 
  whatIfScenario, 
  growthRate, 
  profitMargin, 
  movingAverage 
} from '../utils/finance';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  BarChart3, 
  TrendingUp, 
  LineChart, 
  PieChart, 
  Target, 
  Calculator, 
  Sliders, 
  Brain, 
  ArrowRight 
} from 'lucide-react';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler
);

export default function Analytics() {
  const { finances = [], games = [], expenses = [] } = useData();
  const [activeTab, setActiveTab] = useState('Previsão de Receita');
  
  // What-if state
  const [scenario, setScenario] = useState({
    priceChange: 0,
    capacityChange: 0,
    avgGamesPerMonth: 12
  });

  const revenueData = useMemo(() => {
    const revs = finances.filter(f => f.type === 'revenue');
    return groupByMonth(revs);
  }, [finances]);

  // Previsão de Receita Tab Data
  const forecastData = useMemo(() => {
    const labels = Array.from({ length: 9 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.toLocaleString('default', { month: 'short', year: '2-digit' });
    });
    
    // Convert last 6 months to data points
    const histData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const key = d.toLocaleString('default', { month: 'short' });
      return revenueData[key] || 0;
    });

    const xPoints = [0, 1, 2, 3, 4, 5];
    const { slope, intercept, rSquared } = linearRegression(xPoints, histData);
    
    const futureData = [6, 7, 8].map(x => slope * x + intercept);

    return {
      labels,
      historical: histData,
      forecast: [...histData.map(()=>null).slice(0, 5), histData[5], ...futureData],
      rSquared: (rSquared * 100).toFixed(1),
      slope
    };
  }, [revenueData]);

  const forecastChartConfig = {
    labels: forecastData.labels,
    datasets: [
      {
        label: 'Receita Histórica',
        data: forecastData.historical,
        borderColor: '#39995c',
        backgroundColor: 'rgba(57, 153, 92, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Receita Prevista',
        data: forecastData.forecast,
        borderColor: '#39995c',
        borderDash: [8, 4],
        tension: 0.4
      }
    ]
  };

  // Insights dos Jogos Data
  const gamesInsights = useMemo(() => {
    const byMonth = groupByMonth(games, 'date');
    const totalCap = games.reduce((sum, g) => sum + (g.capacity || 0), 0);
    const totalAtt = games.reduce((sum, g) => sum + (g.checkedIn || 0), 0);
    const avgAtt = totalCap > 0 ? (totalAtt / totalCap) * 100 : 0;
    
    const statusGroup = groupByCategory(games, 'status');
    
    return {
      byMonthLabels: Object.keys(byMonth),
      byMonthData: Object.values(byMonth),
      avgAttendance: avgAtt.toFixed(1),
      statusGroupLabels: Object.keys(statusGroup),
      statusGroupData: Object.values(statusGroup)
    };
  }, [games]);

  const whatIfResult = useMemo(() => {
    // Basic scenario model
    const currentAvgRev = forecastData.historical.reduce((a,b)=>a+b, 0) / 6 || 10000;
    const currentAvgExp = expenses.reduce((a,b)=>a+b.amount,0) / 6 || 5000;
    
    const priceMult = 1 + (scenario.priceChange / 100);
    const capMult = 1 + (scenario.capacityChange / 100);
    const gamesMult = scenario.avgGamesPerMonth / 12; // Assuming 12 is baseline

    const projRev = currentAvgRev * priceMult * capMult * gamesMult;
    const projExp = currentAvgExp * (1 + (scenario.capacityChange/200)); // Expenses rise slightly with capacity
    
    const projProfit = projRev - projExp;
    const projMargin = projProfit > 0 ? (projProfit / projRev) * 100 : 0;
    const revChange = ((projRev - currentAvgRev) / currentAvgRev) * 100;

    return { projRev, projProfit, projMargin, revChange, currentAvgRev, currentAvgProfit: currentAvgRev - currentAvgExp };
  }, [scenario, forecastData, expenses]);

  return (
    <div className="page-analytics w-full p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Brain size={28} className="text-primary" /> Análises e Previsões
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {['Previsão de Receita', 'Insights dos Jogos', 'Cenários Hipotéticos'].map(tab => (
          <button
            key={tab}
            id={`tab-analytics-${tab.replace(/\s+/g, '-').toLowerCase()}`}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === 'Previsão de Receita' && (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><TrendingUp size={20} /> Projeção de 6 Meses</h3>
                <span className="badge badge-info text-xs">R² = {forecastData.rSquared}% Confiança</span>
              </div>
              <div className="h-80 w-full">
                <Line data={forecastChartConfig} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-4">
                <p className="text-sm text-gray-500">Tendência de Crescimento</p>
                <p className={`text-xl font-bold ${forecastData.slope >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {forecastData.slope >= 0 ? '+' : ''}{formatCurrency(forecastData.slope)} /mo
                </p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500">Projeção Próximo Trimestre</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(forecastData.forecast.slice(6, 9).reduce((a, b) => a + b, 0))}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500">Receita Média Mensal</p>
                <p className="text-xl font-bold text-gray-700 dark:text-gray-200">
                  {formatCurrency(forecastData.historical.reduce((a,b)=>a+b,0) / 6)}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Insights dos Jogos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-4">Jogos por Mês</h3>
              <Bar data={{
                labels: gamesInsights.byMonthLabels,
                datasets: [{ label: 'Jogos', data: gamesInsights.byMonthData, backgroundColor: '#3d7fd9' }]
              }} />
            </div>
            <div className="card p-4 flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold mb-4 w-full text-left">Presença Média</h3>
              <div className="text-5xl font-bold text-primary mb-4">{gamesInsights.avgAttendance}%</div>
              <p className="text-gray-500 text-sm">da capacidade total utilizada em todos os jogos</p>
            </div>
            <div className="card p-4 flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-4 w-full text-left">Distribuição de Status dos Jogos</h3>
              <div className="w-64 h-64">
                <Doughnut data={{
                  labels: gamesInsights.statusGroupLabels,
                  datasets: [{
                    data: gamesInsights.statusGroupData,
                    backgroundColor: ['#e8b517', '#39995c', '#cc3333', '#9b59b6']
                  }]
                }} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Cenários Hipotéticos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-6 col-span-1 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Sliders size={20} /> Ajustar Variáveis</h3>
              
              <div className="form-group">
                <label className="form-label flex justify-between">
                  <span>Variação de Preço (%)</span>
                  <span className="font-bold">{scenario.priceChange}%</span>
                </label>
                <input id="slider-price" type="range" min="-50" max="100" value={scenario.priceChange} onChange={(e) => setScenario({...scenario, priceChange: Number(e.target.value)})} className="w-full" />
              </div>

              <div className="form-group">
                <label className="form-label flex justify-between">
                  <span>Variação de Capacidade (%)</span>
                  <span className="font-bold">{scenario.capacityChange}%</span>
                </label>
                <input id="slider-cap" type="range" min="-50" max="100" value={scenario.capacityChange} onChange={(e) => setScenario({...scenario, capacityChange: Number(e.target.value)})} className="w-full" />
              </div>

              <div className="form-group">
                <label className="form-label">Avg Jogos por Mês</label>
                <input id="input-games" type="number" min="0" max="50" value={scenario.avgGamesPerMonth} onChange={(e) => setScenario({...scenario, avgGamesPerMonth: Number(e.target.value)})} className="form-input w-full" />
              </div>
            </div>

            <div className="card p-6 col-span-2 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Calculator size={20} /> Resultados Projetados</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-500">Receita Mensal Projetada</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(whatIfResult.projRev)}</p>
                </div>
                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-500">Lucro Mensal Projetado</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(whatIfResult.projProfit)}</p>
                </div>
                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-500">Margem de Lucro Projetada</p>
                  <p className="text-2xl font-bold text-yellow-600">{whatIfResult.projMargin.toFixed(1)}%</p>
                </div>
                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-500">Variação de Receita</p>
                  <p className={`text-2xl font-bold ${whatIfResult.revChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {whatIfResult.revChange > 0 ? '+' : ''}{whatIfResult.revChange.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="h-64 mt-6">
                <Bar data={{
                  labels: ['Revenue', 'Profit'],
                  datasets: [
                    {
                      label: 'Atual',
                      data: [whatIfResult.currentAvgRev, whatIfResult.currentAvgProfit],
                      backgroundColor: '#d1d5db'
                    },
                    {
                      label: 'Projetado',
                      data: [whatIfResult.projRev, whatIfResult.projProfit],
                      backgroundColor: '#39995c'
                    }
                  ]
                }} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
