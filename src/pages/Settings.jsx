import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { generateSeedData } from '../utils/seed';
import { Settings, Building2, DollarSign, CreditCard, Database, Download, Trash2, Upload, Save, AlertTriangle } from 'lucide-react';

const SettingsPage = () => {
  const { settings, updateSettings, setAllData } = useData();
  const [activeTab, setActiveTab] = useState('company');
  const [toast, setToast] = useState('');
  
  const [formData, setFormData] = useState({
    companyName: settings?.companyName || '',
    companyAddress: settings?.companyAddress || '',
    companyPhone: settings?.companyPhone || '',
    companyEmail: settings?.companyEmail || '',
    defaultOpenPrice: settings?.defaultOpenPrice || 50,
    defaultClosedPrice: settings?.defaultClosedPrice || 600,
    paymentMethods: settings?.paymentMethods || []
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSave = () => {
    updateSettings({ ...settings, ...formData });
    showToast('Alterações salvas com sucesso!');
  };

  const handleExport = () => {
    // Basic export logic mock
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({settings, _mock: 'data'}));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "tacops_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'company':
        return (
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label" htmlFor="comp-name">Nome da Empresa</label>
              <input id="comp-name" type="text" className="form-input" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="comp-addr">Endereço</label>
              <input id="comp-addr" type="text" className="form-input" value={formData.companyAddress} onChange={e => setFormData({...formData, companyAddress: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="comp-phone">Telefone</label>
              <input id="comp-phone" type="text" className="form-input" value={formData.companyPhone} onChange={e => setFormData({...formData, companyPhone: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="comp-email">E-mail</label>
              <input id="comp-email" type="email" className="form-input" value={formData.companyEmail} onChange={e => setFormData({...formData, companyEmail: e.target.value})} />
            </div>
            <button id="btn-save-company" className="btn btn-primary" onClick={handleSave}><Save size={16} /> Salvar Alterações</button>
          </div>
        );
      case 'pricing':
        return (
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label" htmlFor="price-open">Preço Jogo Aberto (R$)</label>
              <input id="price-open" type="number" className="form-input" value={formData.defaultOpenPrice} onChange={e => setFormData({...formData, defaultOpenPrice: parseFloat(e.target.value)})} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="price-closed">Preço Jogo Fechado (R$)</label>
              <input id="price-closed" type="number" className="form-input" value={formData.defaultClosedPrice} onChange={e => setFormData({...formData, defaultClosedPrice: parseFloat(e.target.value)})} />
            </div>
            <button id="btn-save-pricing" className="btn btn-primary" onClick={handleSave}><Save size={16} /> Salvar Alterações</button>
          </div>
        );
      case 'payments':
        return (
          <div className="space-y-4">
            {['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência Bancária'].map(method => {
              const isChecked = formData.paymentMethods.includes(method);
              return (
                <div key={method} className="form-group flex items-center gap-2">
                  <input 
                    id={`pay-${method}`}
                    type="checkbox" 
                    checked={isChecked} 
                    onChange={e => {
                      const next = e.target.checked 
                        ? [...formData.paymentMethods, method] 
                        : formData.paymentMethods.filter(m => m !== method);
                      setFormData({...formData, paymentMethods: next});
                    }}
                  />
                  <label htmlFor={`pay-${method}`}>{method}</label>
                </div>
              )
            })}
            <button id="btn-save-payments" className="btn btn-primary" onClick={handleSave}><Save size={16} /> Salvar Alterações</button>
          </div>
        );
      case 'data':
        return (
          <div className="space-y-6">
            <div className="card border border-border">
              <h3 className="text-md mb-2 flex items-center gap-2"><Database size={18} /> Dados de Demonstração</h3>
              <p className="text-sm text-muted mb-4">Carregue dados de amostra para explorar os recursos.</p>
              <button id="btn-load-demo" className="btn btn-secondary" onClick={() => {
                if (window.confirm("Substituir os dados atuais pelos de demonstração?")) {
                  if (typeof setAllData === 'function' && typeof generateSeedData === 'function') {
                    setAllData(generateSeedData());
                    showToast("Dados de demonstração carregados!");
                  }
                }
              }}><Upload size={16} /> Carregar Dados de Demonstração</button>
            </div>
            
            <div className="card border border-border">
              <h3 className="text-md mb-2 flex items-center gap-2"><Download size={18} /> Exportar</h3>
              <p className="text-sm text-muted mb-4">Baixe um backup em JSON de todos os seus dados.</p>
              <button id="btn-export" className="btn btn-secondary" onClick={handleExport}><Download size={16} /> Exportar JSON</button>
            </div>

            <div className="card border border-danger bg-danger/10">
              <h3 className="text-md mb-2 flex items-center gap-2 text-danger"><AlertTriangle size={18} /> Zona de Perigo</h3>
              <p className="text-sm text-muted mb-4">Excluir permanentemente todos os seus dados. Esta ação não pode ser desfeita.</p>
              <button id="btn-reset-data" className="btn btn-danger" onClick={() => {
                if (window.confirm("AVISO: Tem certeza absoluta? Isso excluirá TUDO.")) {
                  if (typeof setAllData === 'function') {
                    setAllData({});
                    showToast("Todos os dados foram resetados!");
                  }
                }
              }}><Trash2 size={16} /> Limpar Todos os Dados</button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="page-settings p-6 max-w-4xl mx-auto">
      <div className="page-header mb-6">
        <h1 className="text-2xl flex items-center gap-2"><Settings size={24} /> Configurações</h1>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 bg-success text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-2 flex flex-col gap-1 md:col-span-1">
          <button id="tab-company" className={`btn ${activeTab === 'company' ? 'btn-primary' : 'btn-ghost'} justify-start`} onClick={() => setActiveTab('company')}><Building2 size={16} /> Empresa</button>
          <button id="tab-pricing" className={`btn ${activeTab === 'pricing' ? 'btn-primary' : 'btn-ghost'} justify-start`} onClick={() => setActiveTab('pricing')}><DollarSign size={16} /> Preços</button>
          <button id="tab-payments" className={`btn ${activeTab === 'payments' ? 'btn-primary' : 'btn-ghost'} justify-start`} onClick={() => setActiveTab('payments')}><CreditCard size={16} /> Pagamentos</button>
          <button id="tab-data" className={`btn ${activeTab === 'data' ? 'btn-primary' : 'btn-ghost'} justify-start`} onClick={() => setActiveTab('data')}><Database size={16} /> Dados</button>
        </div>

        <div className="card md:col-span-3">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
