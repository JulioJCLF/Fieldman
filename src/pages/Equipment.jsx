import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { 
  EQUIPMENT_CATEGORIES, 
  EQUIPMENT_CONDITIONS, 
  EQUIPMENT_STATUS_LABELS, 
  EQUIPMENT_STATUS_COLORS 
} from '../utils/constants';
import { formatCurrency, formatDate, generateId } from '../utils/constants';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  X, 
  AlertTriangle, 
  Wrench, 
  CheckCircle2, 
  Box 
} from 'lucide-react';

export default function Equipment() {
  const { equipment = [], addEquipment, updateEquipment, deleteEquipment } = useData();
  const { can } = usePermissions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: EQUIPMENT_CATEGORIES[0] || 'Armas de Airsoft',
    quantity: 1,
    available: 1,
    purchasePrice: 0,
    rentalPrice: 0,
    condition: 'Bom',
    notes: ''
  });

  // KPIs
  const totalItems = equipment.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const availableItems = equipment.reduce((sum, item) => sum + (item.available || 0), 0);
  const inUseItems = totalItems - availableItems;
  const needsMaint = equipment.filter(item => item.condition === 'Precisa de Reparo' || (item.maintenanceCount && item.maintenanceCount > 0)).length;

  const lowStockItems = equipment.filter(item => item.available < 2);

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesCondition = conditionFilter === 'All' || item.condition === conditionFilter;
    return matchesSearch && matchesCategory && matchesCondition;
  });

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: EQUIPMENT_CATEGORIES[0] || 'Armas de Airsoft',
        quantity: 1,
        available: 1,
        purchasePrice: 0,
        rentalPrice: 0,
        condition: 'Bom',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingItem) {
      updateEquipment(editingItem.id, { 
        ...formData, 
        quantity: Number(formData.quantity), 
        available: Number(formData.available),
        purchasePrice: Number(formData.purchasePrice),
        rentalPrice: Number(formData.rentalPrice)
      });
    } else {
      addEquipment({ 
        ...formData, 
        id: generateId(), 
        quantity: Number(formData.quantity), 
        available: Number(formData.available),
        purchasePrice: Number(formData.purchasePrice),
        rentalPrice: Number(formData.rentalPrice)
      });
    }
    setIsModalOpen(false);
  };

  const getConditionBadge = (condition) => {
    const map = {
      'New': 'success',
      'Bom': 'primary',
      'Fair': 'warning',
      'Precisa de Reparo': 'danger'
    };
    return `badge badge-${map[condition] || 'info'}`;
  };

  return (
    <div className="page-equipment w-full p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Package size={28} className="text-primary" /> Equipment
        </h1>
        {can('create', 'equipment') && (
          <button id="add-equipment-btn" onClick={() => handleOpenModal()} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Adicionar Equipamento
          </button>
        )}
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
          <AlertTriangle className="text-red-500 mt-0.5" size={20} />
          <div>
            <h4 className="text-red-800 dark:text-red-400 font-semibold">Alerta de Estoque Baixo</h4>
            <p className="text-sm text-red-700 dark:text-red-300">Os seguintes itens têm menos de 2 disponíveis: {lowStockItems.map(i => i.name).join(', ')}</p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 flex flex-col gap-2 border-l-4 border-gray-400">
          <span className="text-sm text-gray-500">Total de Itens</span>
          <span className="text-2xl font-bold text-gray-800 dark:text-white">{totalItems}</span>
        </div>
        <div className="card p-4 flex flex-col gap-2 border-l-4 border-success">
          <span className="text-sm text-gray-500">Disponível</span>
          <span className="text-2xl font-bold text-green-600">{availableItems}</span>
        </div>
        <div className="card p-4 flex flex-col gap-2 border-l-4 border-info">
          <span className="text-sm text-gray-500">Em Uso / Alugado</span>
          <span className="text-2xl font-bold text-blue-600">{inUseItems}</span>
        </div>
        <div className="card p-4 flex flex-col gap-2 border-l-4 border-danger">
          <span className="text-sm text-gray-500">Manutenção Necessária</span>
          <span className="text-2xl font-bold text-red-600">{needsMaint}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4 items-center bg-gray-50 dark:bg-gray-800 border-none">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            id="search-equipment"
            type="text" 
            placeholder="Buscar equipamento..." 
            className="form-input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-48">
          <select id="filter-category" className="form-select w-full" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="All">Todas as Categorias</option>
            {EQUIPMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="w-48">
          <select id="filter-condition" className="form-select w-full" value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)}>
            <option value="All">Todas as Condições</option>
            {EQUIPMENT_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container card">
        <table className="data-table w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 dark:bg-gray-800">
              <th className="p-3">Nome</th>
              <th className="p-3">Categoria</th>
              <th className="p-3 text-center">Qtd</th>
              <th className="p-3 text-center">Disponível</th>
              <th className="p-3 text-center">Em Uso</th>
              <th className="p-3">Condição</th>
              <th className="p-3">Preço de Aluguel</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredEquipment.map(item => (
              <tr key={item.id} className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800 ${item.condition === 'Precisa de Reparo' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                <td className="p-3 font-medium flex items-center gap-2">
                  <Box size={16} className="text-gray-400" /> {item.name}
                </td>
                <td className="p-3">{item.category}</td>
                <td className="p-3 text-center font-semibold">{item.quantity}</td>
                <td className="p-3 text-center font-semibold text-green-600">{item.available}</td>
                <td className="p-3 text-center font-semibold text-blue-600">{item.quantity - item.available}</td>
                <td className="p-3"><span className={getConditionBadge(item.condition)}>{item.condition}</span></td>
                <td className="p-3 text-gray-600 dark:text-gray-300">{formatCurrency(item.rentalPrice)}</td>
                <td className="p-3 text-right space-x-2">
                  {can('edit', 'equipment') && <button id={`edit-eq-${item.id}`} onClick={() => handleOpenModal(item)} className="text-gray-500 hover:text-primary"><Edit size={16} /></button>}
                  {can('delete', 'equipment') && <button id={`del-eq-${item.id}`} onClick={() => deleteEquipment && deleteEquipment(item.id)} className="text-gray-500 hover:text-danger"><Trash2 size={16} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="modal bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="modal-header flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Wrench size={20} /> {editingItem ? 'Editar Equipamento' : 'Adicionar Equipamento'}
              </h2>
              <button id="close-eq-modal" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            
            <div className="modal-body grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group col-span-2">
                <label className="form-label">Nome</label>
                <input id="eq-name" type="text" className="form-input w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select id="eq-cat" className="form-select w-full" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {EQUIPMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Condição</label>
                <select id="eq-cond" className="form-select w-full" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                  {EQUIPMENT_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantidade Total</label>
                <input id="eq-qty" type="number" min="0" className="form-input w-full" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">Atualmente Disponível</label>
                <input id="eq-avail" type="number" min="0" max={formData.quantity} className="form-input w-full" value={formData.available} onChange={e => setFormData({...formData, available: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">Preço de Compra</label>
                <input id="eq-purch" type="number" min="0" step="0.01" className="form-input w-full" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">Preço de Aluguel</label>
                <input id="eq-rent" type="number" min="0" step="0.01" className="form-input w-full" value={formData.rentalPrice} onChange={e => setFormData({...formData, rentalPrice: e.target.value})} />
              </div>

              <div className="form-group col-span-2">
                <label className="form-label">Observações</label>
                <textarea id="eq-notes" rows={3} className="form-input w-full" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
              </div>
            </div>
            
            <div className="modal-footer mt-6 flex justify-end gap-2">
              <button id="cancel-eq-btn" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancelar</button>
              <button id="save-eq-btn" onClick={handleSave} className="btn btn-primary flex items-center gap-2"><CheckCircle2 size={16} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
