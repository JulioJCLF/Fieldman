import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { 
  ROLES, 
  ROLE_LABELS, 
  ROLE_COLORS,
  generateId
} from '../utils/constants';
import { 
  Users as UsersIcon, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Shield, 
  UserPlus, 
  Crown, 
  Briefcase, 
  User, 
  Flag 
} from 'lucide-react';

export default function Usuários() {
  // Assuming DEMO_USERS is exported from AuthContext for demo purposes
  const { user: currentUser, DEMO_USERS = [] } = useAuth();
  const { can } = usePermissions();

  const [usersList, setUsuáriosList] = useState(DEMO_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'staff'
  });

  const getPerfilIcon = (role) => {
    switch (role) {
      case 'owner': return <Crown size={16} />;
      case 'admin': return <Shield size={16} />;
      case 'manager': return <Briefcase size={16} />;
      case 'staff': return <User size={16} />;
      case 'referee': return <Flag size={16} />;
      default: return <User size={16} />;
    }
  };

  const roleStats = useMemo(() => {
    const stats = {};
    Object.values(ROLES).forEach(r => stats[r] = 0);
    usersList.forEach(u => {
      if (stats[u.role] !== undefined) stats[u.role]++;
    });
    return stats;
  }, [usersList]);

  const handleOpenModal = (u = null) => {
    if (u) {
      setEditingUser(u);
      setFormData({
        name: u.name,
        email: u.email,
        username: u.username,
        password: '',
        role: u.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'staff'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingUser) {
      setUsuáriosList(usersList.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
    } else {
      setUsuáriosList([...usersList, { ...formData, id: generateId(), status: 'ativo', lastLogin: new Date().toISOString() }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (id === currentUser?.id) return;
    setUsuáriosList(usersList.filter(u => u.id !== id));
  };

  return (
    <div className="page-users w-full p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UsersIcon size={28} className="text-primary" /> Usuários e Perfis
        </h1>
        {can('create', 'users') && (
          <button id="add-user-btn" onClick={() => handleOpenModal()} className="btn btn-primary flex items-center gap-2">
            <UserPlus size={18} /> Adicionar Usuário
          </button>
        )}
      </div>

      {/* Perfil Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.values(ROLES).map(role => (
          <div key={role} className={`card p-4 flex flex-col gap-2 border-t-4`} style={{ borderTopColor: ROLE_COLORS[role] || '#ccc' }}>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700 dark:text-gray-200 capitalize flex items-center gap-1">
                {getPerfilIcon(role)} {ROLE_LABELS[role]}
              </span>
              <span className="text-2xl font-bold">{roleStats[role]}</span>
            </div>
            <p className="text-xs text-gray-500">Usuários com este perfil</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="table-container card">
        <table className="data-table w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 dark:bg-gray-800">
              <th className="p-3">Usuário</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Perfil</th>
              <th className="p-3">Status</th>
              <th className="p-3">Último Login</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                    {u.name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{u.name} {u.id === currentUser?.id ? '(Você)' : ''}</div>
                    <div className="text-xs text-gray-500">@{u.username}</div>
                  </div>
                </td>
                <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{u.email}</td>
                <td className="p-3">
                  <span className="badge" style={{ backgroundColor: `${ROLE_COLORS[u.role]}20`, color: ROLE_COLORS[u.role], border: `1px solid ${ROLE_COLORS[u.role]}` }}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`badge ${u.status === 'ativo' ? 'badge-success' : 'badge-danger'}`}>
                    {u.status || 'ativo'}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-500">
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Nunca'}
                </td>
                <td className="p-3 text-right space-x-2">
                  {can('edit', 'users') && (
                    <button id={`edit-user-${u.id}`} onClick={() => handleOpenModal(u)} className="text-gray-500 hover:text-primary"><Edit size={16} /></button>
                  )}
                  {can('delete', 'users') && u.id !== currentUser?.id && (
                    <button id={`delete-user-${u.id}`} onClick={() => handleDelete(u.id)} className="text-gray-500 hover:text-danger"><Trash2 size={16} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="modal bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="modal-header flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {editingUser ? <Edit size={20} /> : <UserPlus size={20} />} 
                {editingUser ? 'Editar Perfil' : 'Adicionar Novo Usuário'}
              </h2>
              <button id="close-user-modal" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            
            {!editingUser && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-md">
                <strong>Nota:</strong> Nesta demonstração, novos usuários são salvos apenas na sessão atual.
              </div>
            )}

            <div className="modal-body space-y-4">
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input id="user-name" type="text" className="form-input w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={editingUser && currentUser?.role !== 'owner'} />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input id="user-email" type="email" className="form-input w-full" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={editingUser && currentUser?.role !== 'owner'} />
              </div>
              <div className="form-group">
                <label className="form-label">Usuário</label>
                <input id="user-username" type="text" className="form-input w-full" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} disabled={editingUser && currentUser?.role !== 'owner'} />
              </div>
              {!editingUser && (
                <div className="form-group">
                  <label className="form-label">Senha</label>
                  <input id="user-password" type="password" className="form-input w-full" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Perfil</label>
                <select id="user-role" className="form-select w-full" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} disabled={currentUser?.role !== 'owner'}>
                  {Object.values(ROLES).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
                {currentUser?.role !== 'owner' && <p className="text-xs text-gray-500 mt-1">Apenas proprietários podem alterar perfis.</p>}
              </div>
            </div>
            
            <div className="modal-footer mt-6 flex justify-end gap-2">
              <button id="cancel-user-btn" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancelar</button>
              <button id="save-user-btn" onClick={handleSave} className="btn btn-primary">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
