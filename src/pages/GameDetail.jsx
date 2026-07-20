import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Users, UserCheck, 
  DollarSign, Edit, Trash2, Plus, X, Play, CheckCircle2, 
  XCircle, Save 
} from 'lucide-react';
import { 
  GAME_STATUS_LABELS, GAME_STATUS_COLORS, GAME_TYPE_LABELS, 
  formatCurrency, formatDate, generateId 
} from '../utils/constants';

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { games, fieldAreas, updateGame, deleteGame } = useData();
  const { can } = usePermissions();
  
  const game = games.find(g => g.id === id);
  const area = game ? fieldAreas.find(a => a.id === game.fieldAreaId) : null;

  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', phone: '' });
  const [notes, setNotes] = useState(game?.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  if (!game) {
    return (
      <div className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Jogo não encontrado</h2>
        <button className="btn btn-primary" onClick={() => navigate('/games')}>Voltar para Jogos</button>
      </div>
    );
  }

  const registered = game.players?.length || 0;
  const checkedIn = game.players?.filter(p => p.checkedIn)?.length || 0;
  const progress = game.capacity ? Math.min(100, (registered / game.capacity) * 100) : 0;
  
  const handleStatusChange = (newStatus) => {
    updateGame(id, { status: newStatus });
  };

  const handleAddPlayer = (e) => {
    e.preventDefault();
    const updatedPlayers = [...(game.players || []), { ...newPlayer, id: generateId(), checkedIn: false }];
    updateGame(id, { players: updatedPlayers });
    setNewPlayer({ name: '', phone: '' });
    setIsPlayerModalOpen(false);
  };

  const toggleCheckIn = (playerId) => {
    const updatedPlayers = game.players.map(p => 
      p.id === playerId ? { ...p, checkedIn: !p.checkedIn } : p
    );
    updateGame(id, { players: updatedPlayers });
  };

  const saveNotes = () => {
    updateGame(id, { notes });
    setIsEditingNotes(false);
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este jogo?')) {
      deleteGame(id);
      navigate('/games');
    }
  };

  return (
    <div className="page-game-detail">
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/games')}><ArrowLeft size={20} /></button>
        <h1 style={{ margin: 0 }}>{game.title}</h1>
        <span className={`badge`} style={{ backgroundColor: game.type === 'open' ? 'var(--success)' : 'var(--accent)', color: 'white' }}>
          {GAME_TYPE_LABELS[game.type]}
        </span>
        <span className={`badge`} style={{ backgroundColor: GAME_STATUS_COLORS[game.status], color: 'white' }}>
          {GAME_STATUS_LABELS[game.status]}
        </span>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          {game.status === 'scheduled' && <button className="btn btn-primary" onClick={() => handleStatusChange('open')}>Abrir Inscrições</button>}
          {game.status === 'open' && <button className="btn btn-primary" onClick={() => handleStatusChange('in_progress')}><Play size={16} style={{marginRight: '0.5rem'}}/> Iniciar Jogo</button>}
          {game.status === 'in_progress' && <button className="btn btn-success" onClick={() => handleStatusChange('completed')}><CheckCircle2 size={16} style={{marginRight: '0.5rem'}}/> Finalizar Jogo</button>}
          {can('delete', 'games') && <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={16} /></button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><Calendar size={18} /> Data e Hora</h3>
          <p><strong>Data:</strong> {formatDate(game.date)}</p>
          <p><strong>Hora:</strong> {game.startTime} - {game.endTime}</p>
          <p><strong>Área de Jogo:</strong> {area?.name || 'Desconhecida'}</p>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><Users size={18} /> Capacidade</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Inscritos</span>
            <span>{registered} / {game.capacity || '∞'}</span>
          </div>
          {game.capacity > 0 && (
            <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ height: '100%', background: 'var(--success)', width: `${progress}%` }}></div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <span>Check-in</span>
            <span style={{ fontWeight: 'bold' }}>{checkedIn}</span>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><DollarSign size={18} /> Receita</h3>
          {game.type === 'open' ? (
            <>
              <p><strong>Preço por Jogador:</strong> {formatCurrency(game.pricePerPlayer)}</p>
              <p><strong>Total Estimado:</strong> {formatCurrency(game.pricePerPlayer * registered)}</p>
            </>
          ) : (
            <>
              <p><strong>Preço Total:</strong> {formatCurrency(game.totalPrice)}</p>
              <p><strong>Contato:</strong> {game.contactName} ({game.contactPhone})</p>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UserCheck size={18} /> Lista de Jogadores</h3>
            {['scheduled', 'open', 'in_progress'].includes(game.status) && (
              <button className="btn btn-sm btn-primary" onClick={() => setIsPlayerModalOpen(true)}>
                <Plus size={16} /> Adicionar Jogador
              </button>
            )}
          </div>

          <div className="table-container">
            <table className="data-table" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Check-in</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {game.players?.length > 0 ? (
                  game.players.map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.phone}</td>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={p.checkedIn} 
                          onChange={() => toggleCheckIn(p.id)} 
                          disabled={!['scheduled', 'open', 'in_progress'].includes(game.status)}
                          style={{ width: '1.2rem', height: '1.2rem' }}
                        />
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-danger" 
                          onClick={() => {
                            if(window.confirm('Remover jogador?')) {
                              updateGame(id, { players: game.players.filter(pl => pl.id !== p.id) })
                            }
                          }}
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Nenhum jogador inscrito ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Observações</h3>
            {!isEditingNotes ? (
              <button className="btn btn-sm btn-ghost" onClick={() => setIsEditingNotes(true)}><Edit size={16}/></button>
            ) : (
              <button className="btn btn-sm btn-success" onClick={saveNotes}><Save size={16}/></button>
            )}
          </div>
          
          {isEditingNotes ? (
            <textarea 
              className="form-input" 
              rows="6" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
          ) : (
            <p style={{ whiteSpace: 'pre-wrap', color: notes ? 'inherit' : 'var(--text-muted)' }}>
              {notes || 'Nenhuma observação adicionada.'}
            </p>
          )}
        </div>
      </div>

      {isPlayerModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Adicionar Jogador</h2>
              <button className="btn btn-ghost" onClick={() => setIsPlayerModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddPlayer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome</label>
                  <input required className="form-input" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input required className="form-input" value={newPlayer.phone} onChange={e => setNewPlayer({...newPlayer, phone: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsPlayerModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
