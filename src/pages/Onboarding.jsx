import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { generateSeedData } from '../utils/seed';
import { Target, Building2, MapPin, DollarSign, CreditCard, Database, CheckCircle2, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const Onboarding = () => {
  const { settings, updateSettings, addFieldArea, deleteFieldArea, fieldAreas, setAllData } = useData();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 7;
  const [companyInfo, setCompanyInfo] = useState({ name: '', address: '', phone: '', email: '' });
  const [newArea, setNewArea] = useState({ name: '', description: '', capacity: 20, type: 'urban' });

  const handleNext = () => {
    if (step === 2 && !companyInfo.name) {
      alert("Nome da empresa é obrigatório.");
      return;
    }
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const finishOnboarding = () => {
    updateSettings({ ...settings, onboardingComplete: true });
    navigate('/');
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="text-center" style={{ animation: 'fade-in-up 0.3s ease-out' }}>
            <Target size={64} className="text-primary mx-auto mb-4" />
            <h2 className="text-xl mb-2">Bem-vindo ao TacOps</h2>
            <p className="text-muted mb-4">Vamos configurar seu campo de airsoft em poucos passos.</p>
          </div>
        );
      case 2:
        return (
          <div style={{ animation: 'fade-in-up 0.3s ease-out' }}>
            <h2 className="text-lg mb-4"><Building2 className="inline mr-2" /> Informações da Empresa</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="comp-name">Nome da Empresa *</label>
              <input id="comp-name" type="text" className="form-input" value={companyInfo.name} onChange={e => { setCompanyInfo({...companyInfo, name: e.target.value}); updateSettings({...settings, companyName: e.target.value}); }} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="comp-address">Endereço</label>
              <input id="comp-address" type="text" className="form-input" value={companyInfo.address} onChange={e => { setCompanyInfo({...companyInfo, address: e.target.value}); updateSettings({...settings, companyAddress: e.target.value}); }} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="comp-phone">Telefone</label>
              <input id="comp-phone" type="text" className="form-input" value={companyInfo.phone} onChange={e => { setCompanyInfo({...companyInfo, phone: e.target.value}); updateSettings({...settings, companyPhone: e.target.value}); }} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="comp-email">E-mail</label>
              <input id="comp-email" type="email" className="form-input" value={companyInfo.email} onChange={e => { setCompanyInfo({...companyInfo, email: e.target.value}); updateSettings({...settings, companyEmail: e.target.value}); }} />
            </div>
          </div>
        );
      case 3:
        return (
          <div style={{ animation: 'fade-in-up 0.3s ease-out' }}>
            <h2 className="text-lg mb-4"><MapPin className="inline mr-2" /> Áreas de Jogo</h2>
            <div className="card mb-4">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input id="area-name" type="text" className="form-input" placeholder="Nome da Área" value={newArea.name} onChange={e => setNewArea({...newArea, name: e.target.value})} />
                <select id="area-type" className="form-select" value={newArea.type} onChange={e => setNewArea({...newArea, type: e.target.value})}>
                  <option value="urban">Urbano</option>
                  <option value="woods">Mata</option>
                  <option value="cqb">CQB</option>
                </select>
                <input id="area-capacity" type="number" className="form-input" placeholder="Capacidade" value={newArea.capacity} onChange={e => setNewArea({...newArea, capacity: parseInt(e.target.value)})} />
                <button id="btn-add-area" className="btn btn-secondary" onClick={() => { if(newArea.name) { addFieldArea({...newArea, id: Date.now().toString()}); setNewArea({name: '', description: '', capacity: 20, type: 'urban'}); } }}>
                  <Plus size={16} /> Adicionar Área
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {fieldAreas?.map(area => (
                <div key={area.id} className="card py-2 flex justify-between items-center">
                  <div>
                    <span className="font-bold">{area.name}</span> <span className="badge badge-info">{area.type}</span> <span className="text-sm text-muted">Cap: {area.capacity}</span>
                  </div>
                  <button id={`btn-del-area-${area.id}`} className="btn btn-ghost text-danger p-1" onClick={() => deleteFieldArea(area.id)}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div style={{ animation: 'fade-in-up 0.3s ease-out' }}>
            <h2 className="text-lg mb-4"><DollarSign className="inline mr-2" /> Preços Padrão</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="price-open">Preço Jogo Aberto (R$)</label>
              <input id="price-open" type="number" className="form-input" value={settings?.defaultOpenPrice || 50} onChange={e => updateSettings({...settings, defaultOpenPrice: parseFloat(e.target.value)})} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="price-closed">Preço Jogo Fechado (R$)</label>
              <input id="price-closed" type="number" className="form-input" value={settings?.defaultClosedPrice || 600} onChange={e => updateSettings({...settings, defaultClosedPrice: parseFloat(e.target.value)})} />
            </div>
          </div>
        );
      case 5:
        return (
          <div style={{ animation: 'fade-in-up 0.3s ease-out' }}>
            <h2 className="text-lg mb-4"><CreditCard className="inline mr-2" /> Métodos de Pagamento</h2>
            {['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência Bancária'].map(method => {
              const isChecked = settings?.paymentMethods?.includes(method);
              return (
                <div key={method} className="form-group flex items-center gap-2">
                  <input 
                    id={`pay-${method}`}
                    type="checkbox" 
                    checked={isChecked || false} 
                    onChange={e => {
                      const curr = settings?.paymentMethods || [];
                      const next = e.target.checked ? [...curr, method] : curr.filter(m => m !== method);
                      updateSettings({...settings, paymentMethods: next});
                    }}
                  />
                  <label htmlFor={`pay-${method}`}>{method}</label>
                </div>
              )
            })}
          </div>
        );
      case 6:
        return (
          <div className="text-center" style={{ animation: 'fade-in-up 0.3s ease-out' }}>
            <h2 className="text-lg mb-4"><Database className="inline mr-2" /> Carregar Dados de Demonstração</h2>
            <p className="text-muted mb-4">Quer explorar o TacOps com alguns jogos, jogadores e registros financeiros preenchidos?</p>
            <button id="btn-load-demo" className="btn btn-secondary w-full" onClick={() => {
              if (window.confirm("Isso substituirá os dados atuais por dados de demonstração. Continuar?")) {
                if (typeof setAllData === 'function' && typeof generateSeedData === 'function') {
                  setAllData(generateSeedData());
                  alert("Dados de demonstração carregados!");
                }
              }
            }}>
              Carregar Dados de Demonstração
            </button>
          </div>
        );
      case 7:
        return (
          <div className="text-center" style={{ animation: 'fade-in-up 0.3s ease-out' }}>
            <CheckCircle2 size={64} className="text-success mx-auto mb-4" />
            <h2 className="text-xl mb-2">Tudo Pronto!</h2>
            <p className="text-muted mb-4">Seu painel do TacOps está pronto para uso.</p>
            <button id="btn-finish" className="btn btn-primary w-full" onClick={finishOnboarding}>
              Ir para o Painel
            </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="page-onboarding min-h-screen flex items-center justify-center bg-background p-4">
      <div className="card max-w-lg w-full">
        {/* Progress Bar */}
        <div className="wizard-progress mb-6 h-2 bg-surface rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
        </div>

        <div className="wizard-body min-h-[300px]">
          {renderStep()}
        </div>

        {step < totalSteps && (
          <div className="wizard-footer mt-6 flex justify-between border-t border-border pt-4">
            <button id="btn-back" className="btn btn-ghost" onClick={handleBack} disabled={step === 1}>
              <ChevronLeft size={16} /> Voltar
            </button>
            <button id="btn-next" className="btn btn-primary" onClick={handleNext}>
              Próximo <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
