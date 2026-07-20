import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { 
  Crosshair, Plus, Search, Filter, Calendar, MapPin, 
  Users, Edit, Trash2, Eye, X, Clock 
} from 'lucide-react';
import { 
  GAME_STATUS, GAME_STATUS_LABELS, GAME_STATUS_COLORS, 
  GAME_TYPES, GAME_TYPE_LABELS, formatCurrency, 
  formatDate, formatDateTime, generateId 
} from '../utils/constants';

export default function Games() {
  const { games, fieldAreas, addGame, updateGame, deleteGame } = useData();
  const { can } = usePermissions();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('Todos os Jogos');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  
  const [formData, setFormData] = useState({
    type: 'open',
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    fieldAreaId: '',
    capacity: 0,
    pricePerPlayer: 0,
    totalPrice: 0,
    contactName: '',
    contactPhone: '',
    notes: '',
    status: 'scheduled'
  });

  const filteredGames = useMemo(() => {
    return games.filter(game => {
      if (activeTab === 'Jogos Abertos' && game.type !== 'open') return false;
      if (activeTab === 'Jogos Fechados' && game.type !== 'closed') return false;
      
      if (search && !game.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'All' && game.status !== statusFilter) return false;
      
      if (fromDate && new Date(game.date) < new Date(fromDate)) return false;
      if (toDate && new Date(game.date) > new Date(toDate)) return false;
      
      return true;
    });
  }, [games, activeTab, search, statusFilter, fromDate, toDate]);

  const openModal = (game = null) => {
    if (game) {
      setEditingGame(game);
      setFormData(game);
    } else {
      setEditingGame(null);
      setFormData({
        type: 'open',
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        fieldAreaId: fieldAreas[0]?.id || '',
        capacity: 0,
        pricePerPlayer: 0,
        totalPrice: 0,
        contactName: '',
        contactPhone: '',
        notes: '',
        status: 'scheduled'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingGame) {
      updateGame(editingGame.id, formData);
    } else {
      addGame({ ...formData, id: generateId(), players: [] });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este jogo?')) {
      deleteGame(id);
    }
  };

  return (
    <div className="page-games">
      <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Jogos</h1>
        {can('create', 'games') && (
          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={16} style={{ marginRight: '0.5rem' }} /> Novo Jogo
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        {['Todos os Jogos', 'Jogos Abertos', 'Jogos Fechados'].map(tab => (
          <button 
            key={tab} 
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="filter-section" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.5rem', top: '0.75rem', color: '#666' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Buscar jogos..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2rem' }}
            />
          </div>
        </div>
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">Todos os Status</option>
          {Object.entries(GAME_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <input type="date" className="form-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" className="form-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
      </div>

      {filteredGames.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)' }}>
          <Crosshair size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
          <p>Nenhum jogo encontrado com os filtros selecionados.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filteredGames.map(game => {
            const area = fieldAreas.find(a => a.id === game.fieldAreaId);
            const registered = game.players?.length || 0;
            const progress = game.capacity ? Math.min(100, (registered / game.capacity) * 100) : 0;
            
            return (
              <div key={game.id} className="card" style={{ padding: '1rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className={`badge`} style={{ backgroundColor: game.type === 'open' ? 'var(--success)' : 'var(--accent)', color: 'white' }}>
                    {GAME_TYPE_LABELS[game.type]}
                  </span>
                  <span className={`badge`} style={{ backgroundColor: GAME_STATUS_COLORS[game.status], color: 'white' }}>
                    {GAME_STATUS_LABELS[game.status]}
                  </span>
                </div>
                
                <h3 style={{ margin: '0.5rem 0' }}>{game.title}</h3>
                
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={14} /> {formatDate(game.date)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={14} /> {game.startTime} - {game.endTime}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={14} /> {area?.name || 'Área Desconhecida'}</div>
                </div>

                <div style={{ margin: '1rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span><Users size={14} style={{ verticalAlign: 'middle' }}/> Jogadores</span>
                    <span>{registered} / {game.capacity || '∞'}</span>
                  </div>
                  {game.capacity > 0 && (
                    <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--success)', width: `${progress}%` }}></div>
                    </div>
                  )}
                </div>

                <div style={{ fontWeight: 'bold', marginBottom: '1rem' }}>
                  {game.type === 'open' ? `${formatCurrency(game.pricePerPlayer)} / jogador` : `${formatCurrency(game.totalPrice)} total`}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <Link to={`/games/${game.id}`} className="btn btn-ghost btn-sm" id={`view-btn-${game.id}`}><Eye size={16} /></Link>
                  {can('update', 'games') && <button className="btn btn-ghost btn-sm" onClick={() => openModal(game)} id={`edit-btn-${game.id}`}><Edit size={16} /></button>}
                  {can('delete', 'games') && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(game.id)} id={`delete-btn-${game.id}`}><Trash2 size={16} /></button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>{editingGame ? 'Editar Jogo' : 'Novo Jogo'}</h2>
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Tipo de Jogo</label>
                  <select className="form-select" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    {Object.entries(GAME_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Título</label>
                  <input required className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Data</label>
                  <input type="date" required className="form-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Área de Jogo</label>
                  <select className="form-select" value={formData.fieldAreaId} onChange={e => setFormData({...formData, fieldAreaId: e.target.value})}>
                    <option value="">Selecionar Área...</option>
                    {fieldAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Hora de Início</label>
                  <input type="time" required className="form-input" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Hora de Término</label>
                  <input type="time" required className="form-input" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Capacidade (0 para ilimitado)</label>
                  <input type="number" min="0" required className="form-input" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    {Object.entries(GAME_STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                {formData.type === 'open' ? (
                  <div className="form-group">
                    <label className="form-label">Preço por Jogador (R$)</label>
                    <input type="number" min="0" step="0.01" required className="form-input" value={formData.pricePerPlayer} onChange={e => setFormData({...formData, pricePerPlayer: Number(e.target.value)})} />
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Preço Total (R$)</label>
                      <input type="number" min="0" step="0.01" required className="form-input" value={formData.totalPrice} onChange={e => setFormData({...formData, totalPrice: Number(e.target.value)})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nome do Contato</label>
                      <input required className="form-input" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Telefone do Contato</label>
                      <input required className="form-input" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} />
                    </div>
                  </>
                )}
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Observações</label>
                  <textarea className="form-input" rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Jogo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
