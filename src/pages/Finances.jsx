import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { 
  formatCurrency, 
  formatDate, 
  generateId 
} from '../utils/constants';
import { 
  EXPENSE_CATEGORIES, 
  REVENUE_SOURCES 
} from '../utils/constants';
import { 
  groupByMonth, 
  groupByCategory, 
  profitMargin, 
  growthRate 
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
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  X, 
  PieChart, 
  BarChart3, 
  Receipt 
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

export default function Finances() {
  const { finances = [], expenses = [], addExpense, updateExpense, deleteExpense } = useData();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState('Visão Geral');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  const [expenseForm, setExpenseForm] = useState({
    category: EXPENSE_CATEGORIES[0] || 'Utilidades',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cartão de Crédito'
  });

  const [expenseFilter, setExpenseFilter] = useState('All');

  // KPIs
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const revenueThisMonth = finances
    .filter(f => f.type === 'revenue' && new Date(f.date).getMonth() === currentMonth && new Date(f.date).getFullYear() === currentYear)
    .reduce((sum, f) => sum + f.amount, 0);

  const expensesThisMonth = expenses
    .filter(e => new Date(e.date).getMonth() === currentMonth && new Date(e.date).getFullYear() === currentYear)
    .reduce((sum, e) => sum + e.amount, 0);

  const netProfit = revenueThisMonth - expensesThisMonth;
  const currentProfitMargin = profitMargin(revenueThisMonth, expensesThisMonth);

  // Charts Data
  const monthlyData = useMemo(() => {
    const rev = groupByMonth(finances.filter(f => f.type === 'revenue'));
    const exp = groupByMonth(expenses);
    const labels = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.toLocaleString('default', { month: 'short' });
    });
    
    return {
      labels,
      revenue: labels.map(l => rev[l] || 0),
      expenses: labels.map(l => exp[l] || 0)
    };
  }, [finances, expenses]);

  const revenueVsExpensesData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Receita',
        data: monthlyData.revenue,
        backgroundColor: '#39995c',
      },
      {
        label: 'Despesas',
        data: monthlyData.expenses,
        backgroundColor: '#cc3333',
      }
    ]
  };

  const cashFlowData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Lucro Líquido',
        data: monthlyData.revenue.map((r, i) => r - monthlyData.expenses[i]),
        borderColor: '#5a7a2e',
        backgroundColor: 'rgba(90, 122, 46, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const revenueSourceData = useMemo(() => {
    const grouped = groupByCategory(finances.filter(f => f.type === 'revenue'), 'source');
    return {
      labels: Object.keys(grouped),
      datasets: [{
        data: Object.values(grouped),
        backgroundColor: ['#39995c', '#3d7fd9', '#e8b517', '#cc3333', '#9b59b6']
      }]
    };
  }, [finances]);

  const handleOpenExpenseModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setExpenseForm(expense);
    } else {
      setEditingExpense(null);
      setExpenseForm({
        category: EXPENSE_CATEGORIES[0] || 'Utilidades',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cartão de Crédito'
      });
    }
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = () => {
    if (editingExpense) {
      updateExpense(editingExpense.id, { ...expenseForm, amount: Number(expenseForm.amount) });
    } else {
      addExpense({ ...expenseForm, id: generateId(), amount: Number(expenseForm.amount) });
    }
    setIsExpenseModalOpen(false);
  };

  const filteredExpenses = expenses.filter(e => expenseFilter === 'All' || e.category === expenseFilter).sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedRevenue = finances.filter(f => f.type === 'revenue').sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="page-finances w-full p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finanças</h1>
        {can('create', 'expenses') && (
          <button id="add-expense-btn" onClick={() => handleOpenExpenseModal()} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Adicionar Despesa
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 flex flex-col gap-2 border-l-4 border-success">
          <span className="text-sm text-gray-500">Receita Total</span>
          <span className="text-2xl font-bold text-green-600">{formatCurrency(revenueThisMonth)}</span>
        </div>
        <div className="card p-4 flex flex-col gap-2 border-l-4 border-danger">
          <span className="text-sm text-gray-500">Total de Despesas</span>
          <span className="text-2xl font-bold text-red-600">{formatCurrency(expensesThisMonth)}</span>
        </div>
        <div className="card p-4 flex flex-col gap-2 border-l-4 border-primary">
          <span className="text-sm text-gray-500">Lucro Líquido</span>
          <span className="text-2xl font-bold text-blue-600">{formatCurrency(netProfit)}</span>
        </div>
        <div className="card p-4 flex flex-col gap-2 border-l-4 border-accent">
          <span className="text-sm text-gray-500">Margem de Lucro</span>
          <span className="text-2xl font-bold text-yellow-600">{currentProfitMargin.toFixed(1)}%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {['Visão Geral', 'Receita', 'Despesas'].map(tab => (
          <button
            key={tab}
            id={`tab-${tab.toLowerCase()}`}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'Visão Geral' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-4">Receita vs Despesas</h3>
              <Bar data={revenueVsExpensesData} />
            </div>
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa</h3>
              <Line data={cashFlowData} />
            </div>
            <div className="card p-4 lg:col-span-2 flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-4 w-full text-left">Receita por Fonte</h3>
              <div className="w-64 h-64">
                <Doughnut data={revenueSourceData} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Receita' && (
          <div className="table-container card">
            <table className="data-table w-full text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3">Data</th>
                  <th className="p-3">Fonte</th>
                  <th className="p-3">Descrição</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Jogo</th>
                </tr>
              </thead>
              <tbody>
                {sortedRevenue.map(f => (
                  <tr key={f.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-3">{formatDate(f.date)}</td>
                    <td className="p-3">{f.source}</td>
                    <td className="p-3">{f.description}</td>
                    <td className="p-3 font-semibold text-green-600">{formatCurrency(f.amount)}</td>
                    <td className="p-3">{f.gameId || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="p-3 font-bold text-right">Total:</td>
                  <td colSpan="2" className="p-3 font-bold text-green-600">{formatCurrency(sortedRevenue.reduce((s, r) => s + r.amount, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {activeTab === 'Despesas' && (
          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="form-group w-64">
                <label className="form-label text-sm">Filtrar por Categoria</label>
                <select id="expense-category-filter" className="form-select" value={expenseFilter} onChange={e => setExpenseFilter(e.target.value)}>
                  <option value="All">Todas as Categorias</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="table-container card">
              <table className="data-table w-full text-left border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="p-3">Data</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Descrição</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Método de Pagamento</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(e => (
                    <tr key={e.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3">{formatDate(e.date)}</td>
                      <td className="p-3"><span className="badge badge-info">{e.category}</span></td>
                      <td className="p-3">{e.description}</td>
                      <td className="p-3 font-semibold text-red-600">{formatCurrency(e.amount)}</td>
                      <td className="p-3">{e.paymentMethod}</td>
                      <td className="p-3 text-right space-x-2">
                        {can('edit', 'expenses') && <button id={`edit-expense-${e.id}`} onClick={() => handleOpenExpenseModal(e)} className="text-gray-500 hover:text-primary"><Edit size={16} /></button>}
                        {can('delete', 'expenses') && <button id={`delete-expense-${e.id}`} onClick={() => deleteExpense && deleteExpense(e.id)} className="text-gray-500 hover:text-danger"><Trash2 size={16} /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="modal bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="modal-header flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingExpense ? 'Editar Despesa' : 'Adicionar Despesa'}</h2>
              <button id="close-modal-btn" onClick={() => setIsExpenseModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="modal-body space-y-4">
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select id="expense-category" className="form-select w-full" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <input id="expense-description" type="text" className="form-input w-full" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Valor</label>
                <input id="expense-amount" type="number" className="form-input w-full" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Data</label>
                <input id="expense-date" type="date" className="form-input w-full" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Método de Pagamento</label>
                <select id="expense-payment-method" className="form-select w-full" value={expenseForm.paymentMethod} onChange={e => setExpenseForm({...expenseForm, paymentMethod: e.target.value})}>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Pix">Pix</option>
                </select>
              </div>
            </div>
            <div className="modal-footer mt-6 flex justify-end gap-2">
              <button id="cancel-expense-btn" onClick={() => setIsExpenseModalOpen(false)} className="btn btn-ghost">Cancelar</button>
              <button id="save-expense-btn" onClick={handleSaveExpense} className="btn btn-primary">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
