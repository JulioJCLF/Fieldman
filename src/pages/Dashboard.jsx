import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Crosshair, DollarSign, Users, Package, TrendingUp, TrendingDown, Calendar, ArrowRight, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/constants';

// Register Chart.js components
if (ChartJS) {
  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);
}

const Dashboard = () => {
  const { user } = useAuth();
  const { games = [], billing = [], equipment = [], finances = [] } = useData();
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    // Simple mock logic for chart since groupByMonth isn't fully defined yet
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = [1200, 1900, 1500, 2200, 1800, 2800];
    
    setChartData({
      labels: months,
      datasets: [
        {
          label: 'Receita',
          data: data,
          borderColor: '#5a7a2e',
          backgroundColor: 'rgba(90, 122, 46, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    });
  }, [finances]);

  const upcomingGames = games.filter(g => new Date(g.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
  const recentBilling = [...billing].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const activePlayers = 154; // Mock
  const equipmentUtil = 76; // Mock

  const getStatusBadge = (status) => {
    const map = {
      'paid': 'badge-success',
      'pending': 'badge-warning',
      'overdue': 'badge-danger'
    };
    return `badge ${map[status] || 'badge-info'}`;
  };

  return (
    <div className="page-dashboard">
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-xl">Painel</h1>
          <p className="text-muted">Bem-vindo de volta, {user?.name || 'Usuário'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link id="btn-new-game" to="/games" className="btn btn-primary btn-sm"><Plus size={16} /> Novo Jogo</Link>
          <Link id="btn-new-expense" to="/finances" className="btn btn-secondary btn-sm">Nova Despesa</Link>
          <Link id="btn-reports" to="/analytics" className="btn btn-secondary btn-sm">Relatórios</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ '--kpi-color': 'var(--color-success)', borderTop: '4px solid var(--kpi-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="text-muted text-sm">Receita Total</p>
              <h3 className="text-lg">{formatCurrency(28500)}</h3>
            </div>
            <div style={{ padding: '0.5rem', background: 'rgba(57, 153, 92, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)' }}>
              <DollarSign size={24} />
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-success)', fontSize: '0.875rem' }}>
            <TrendingUp size={16} /> <span>12% vs mês anterior</span>
          </div>
        </div>

        <div className="card" style={{ '--kpi-color': 'var(--color-info)', borderTop: '4px solid var(--kpi-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="text-muted text-sm">Jogos Este Mês</p>
              <h3 className="text-lg">24</h3>
            </div>
            <div style={{ padding: '0.5rem', background: 'rgba(61, 127, 217, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-info)' }}>
              <Crosshair size={24} />
            </div>
          </div>
        </div>

        <div className="card" style={{ '--kpi-color': 'var(--color-accent)', borderTop: '4px solid var(--kpi-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="text-muted text-sm">Jogadores Ativos</p>
              <h3 className="text-lg">{activePlayers}</h3>
            </div>
            <div style={{ padding: '0.5rem', background: 'rgba(232, 181, 23, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-accent)' }}>
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="card" style={{ '--kpi-color': 'var(--color-primary)', borderTop: '4px solid var(--kpi-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="text-muted text-sm">Utilização de Equipamentos</p>
              <h3 className="text-lg">{equipmentUtil}%</h3>
            </div>
            <div style={{ padding: '0.5rem', background: 'rgba(90, 122, 46, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-primary)' }}>
              <Package size={24} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card">
          <h3 className="text-md" style={{ marginBottom: '1rem' }}>Visão Geral de Receita</h3>
          <div style={{ height: '300px' }}>
            {chartData && Line && <Line data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="text-md">Próximos Jogos</h3>
              <Link id="link-all-games" to="/games" className="text-primary text-sm" style={{ display: 'flex', alignItems: 'center' }}>Ver Todos <ArrowRight size={16} /></Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {upcomingGames.map(game => (
                <Link id={`upcoming-game-${game.id}`} key={game.id} to={`/games/${game.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'inherit' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.875rem' }}>{game.title}</h4>
                    <span className="text-muted text-xs" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={12} /> {formatDate(game.date)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-info text-xs">{game.type}</span>
                    <span className="text-sm">{game.registeredPlayers}/{game.capacity}</span>
                  </div>
                </Link>
              ))}
              {upcomingGames.length === 0 && <p className="text-muted text-sm text-center">Sem jogos agendados</p>}
            </div>
          </div>

          <div className="card">
            <h3 className="text-md" style={{ marginBottom: '1rem' }}>Faturamento Recente</h3>
            <div className="table-container">
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Jogo/Item</th>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBilling.map(bill => (
                    <tr key={bill.id}>
                      <td>{bill.description || bill.gameId}</td>
                      <td>{formatDate(bill.date)}</td>
                      <td>{formatCurrency(bill.amount)}</td>
                      <td><span className={getStatusBadge(bill.status)}>{bill.status}</span></td>
                    </tr>
                  ))}
                  {recentBilling.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">Sem faturamento recente</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
