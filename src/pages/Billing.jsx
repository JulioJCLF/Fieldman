import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { 
  Receipt, DollarSign, Plus, Search, Filter, Edit, 
  Trash2, X, CheckCircle2, AlertCircle, Clock, CreditCard, TrendingUp 
} from 'lucide-react';
import { 
  PAYMENT_STATUS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, 
  PAYMENT_METHODS, formatCurrency, formatDate, generateId 
} from '../utils/constants';

export default function Billing() {
  const { billing, games, addBilling, updateBilling, deleteBilling } = useData();
  const { can } = usePermissions();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const [formData, setFormData] = useState({
    gameId: '',
    totalAmount: 0,
    paidAmount: 0,
    paymentMethod: 'pix',
    status: 'pending',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredBilling = useMemo(() => {
    return billing.filter(inv => {
      const game = games.find(g => g.id === inv.gameId);
      const searchMatch = inv.id.includes(search) || (game?.title || '').toLowerCase().includes(search.toLowerCase());
      if (search && !searchMatch) return false;
      
      if (statusFilter !== 'All' && inv.status !== statusFilter) return false;
      if (methodFilter !== 'All' && inv.paymentMethod !== methodFilter) return false;
      
      if (fromDate && new Date(inv.date) < new Date(fromDate)) return false;
      if (toDate && new Date(inv.date) > new Date(toDate)) return false;
      
      return true;
    });
  }, [billing, games, search, statusFilter, methodFilter, fromDate, toDate]);

  const kpis = useMemo(() => {
    let totalBilled = 0;
    let totalCollected = 0;
    let pendingAmount = 0;
    let overdueCount = 0;

    billing.forEach(inv => {
      totalBilled += inv.totalAmount || 0;
      totalCollected += inv.paidAmount || 0;
      if (['pending', 'partial'].includes(inv.status)) {
        pendingAmount += ((inv.totalAmount || 0) - (inv.paidAmount || 0));
      }
      if (inv.status === 'overdue') {
        overdueCount++;
      }
    });

    return { totalBilled, totalCollected, pendingAmount, overdueCount };
  }, [billing]);

  const openModal = (invoice = null) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData(invoice);
    } else {
      setEditingInvoice(null);
      setFormData({
        gameId: '',
        totalAmount: 0,
        paidAmount: 0,
        paymentMethod: 'pix',
        status: 'pending',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleGameChange = (gameId) => {
    const game = games.find(g => g.id === gameId);
    let total = 0;
    if (game) {
      if (game.type === 'open') {
        total = (game.players?.length || 0) * (game.pricePerPlayer || 0);
      } else {
        total = game.totalPrice || 0;
      }
    }
    setFormData({ ...formData, gameId, totalAmount: total });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingInvoice) {
      updateBilling(editingInvoice.id, formData);
    } else {
      addBilling({ ...formData, id: generateId() });
    }
    setIsModalOpen(false);
  };

  const markAsPaid = (invoice) => {
    updateBilling(invoice.id, { 
      status: 'paid', 
      paidAmount: invoice.totalAmount 
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Excluir esta fatura?')) {
      deleteBilling(id);
    }
  };

  // Games that don't have an invoice yet (for new invoice dropdown)
  const availableGames = games.filter(g => !billing.some(b => b.gameId === g.id) || (editingInvoice && editingInvoice.gameId === g.id));

  return (
    <div className="page-billing">
      <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Faturamento e Faturas</h1>
        {can('create', 'billing') && (
          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={16} style={{ marginRight: '0.5rem' }} /> Nova Fatura
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '50%' }}><TrendingUp size={24} /></div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Faturado</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(kpis.totalBilled)}</div>
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '50%' }}><CheckCircle2 size={24} /></div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Recebido</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(kpis.totalCollected)}</div>
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderRadius: '50%' }}><Clock size={24} /></div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Pendente</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(kpis.pendingAmount)}</div>
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '50%' }}><AlertCircle size={24} /></div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Atrasado</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{kpis.overdueCount} Faturas</div>
          </div>
        </div>
      </div>

      <div className="filter-section card" style={{ display: 'flex', gap: '1rem', padding: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 1, minWidth: '200px', margin: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.5rem', top: '0.75rem', color: '#666' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Buscar faturas..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2rem' }}
            />
          </div>
        </div>
        <select className="form-select" style={{ margin: 0, width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">Todos os Status</option>
          {Object.entries(PAYMENT_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select className="form-select" style={{ margin: 0, width: 'auto' }} value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
          <option value="All">Todos os Métodos</option>
          {PAYMENT_METHODS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input type="date" className="form-input" style={{ margin: 0, width: 'auto' }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" className="form-input" style={{ margin: 0, width: 'auto' }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
      </div>

      <div className="card table-container">
        <table className="data-table" style={{ width: '100%', textAlign: 'left' }}>
          <thead>
            <tr>
              <th>Fatura #</th>
              <th>Jogo</th>
              <th>Data</th>
              <th>Valor</th>
              <th>Pago</th>
              <th>Status</th>
              <th>Método</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredBilling.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Nenhuma fatura encontrada.</td></tr>
            ) : (
              filteredBilling.map(inv => {
                const game = games.find(g => g.id === inv.gameId);
                const methodLabel = PAYMENT_METHODS.find(m => m.id === inv.paymentMethod)?.label || inv.paymentMethod;
                
                return (
                  <tr key={inv.id}>
                    <td><span style={{ fontFamily: 'monospace' }}>{inv.id.substring(0, 8)}</span></td>
                    <td>{game?.title || 'Jogo Desconhecido'}</td>
                    <td>{formatDate(inv.date)}</td>
                    <td style={{ fontWeight: 'bold' }}>{formatCurrency(inv.totalAmount)}</td>
                    <td style={{ color: inv.paidAmount >= inv.totalAmount ? 'var(--success)' : 'inherit' }}>
                      {formatCurrency(inv.paidAmount)}
                    </td>
                    <td>
                      <span className={`badge`} style={{ backgroundColor: PAYMENT_STATUS_COLORS[inv.status], color: 'white' }}>
                        {PAYMENT_STATUS_LABELS[inv.status]}
                      </span>
                    </td>
                    <td>{methodLabel}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {inv.status !== 'paid' && can('update', 'billing') && (
                          <button className="btn btn-sm btn-success" onClick={() => markAsPaid(inv)} title="Marcar como Pago">
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {can('update', 'billing') && (
                          <button className="btn btn-sm btn-ghost" onClick={() => openModal(inv)} title="Editar">
                            <Edit size={16} />
                          </button>
                        )}
                        {can('delete', 'billing') && (
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(inv.id)} title="Excluir">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>{editingInvoice ? 'Editar Fatura' : 'Nova Fatura'}</h2>
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                
                {!editingInvoice && (
                  <div className="form-group">
                    <label className="form-label">Jogo</label>
                    <select required className="form-select" value={formData.gameId} onChange={(e) => handleGameChange(e.target.value)}>
                      <option value="">Selecione um jogo...</option>
                      {availableGames.map(g => (
                        <option key={g.id} value={g.id}>{g.title} ({formatDate(g.date)})</option>
                      ))}
                    </select>
                  </div>
                )}

                {editingInvoice && (
                  <div className="form-group">
                    <label className="form-label">Jogo</label>
                    <input className="form-input" disabled value={games.find(g => g.id === formData.gameId)?.title || ''} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Valor Total</label>
                    <input type="number" readOnly className="form-input" value={formData.totalAmount} style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Valor Pago</label>
                    <input type="number" step="0.01" min="0" required className="form-input" value={formData.paidAmount} onChange={e => setFormData({...formData, paidAmount: Number(e.target.value)})} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      {Object.entries(PAYMENT_STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Método de Pagamento</label>
                    <select className="form-select" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                      {PAYMENT_METHODS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Data</label>
                  <input type="date" required className="form-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea className="form-input" rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                </div>

              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Fatura</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
