import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Target, Eye, EyeOff, Shield } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { loginAs } = useAuth();
  const { settings } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = (role) => {
    try {
      loginAs(role);
      
      const from = location.state?.from?.pathname;
      
      if (settings?.onboardingComplete === false) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(from || '/', { replace: true });
      }
    } catch (err) {
      setError('Usuário ou senha inválidos');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      handleLogin('admin');
    } else {
      setError('Usuário ou senha inválidos. Tente admin/admin ou use uma conta de demonstração abaixo.');
    }
  };

  return (
    <div className="page-login" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, var(--color-surface) 0%, var(--color-background) 100%)'
    }}>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', animation: 'fade-in-up 0.5s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <Target size={48} className="text-primary" />
          </div>
          <h1 className="text-xl" style={{ margin: 0 }}>TacOps</h1>
          <p className="text-muted">Airsoft Field Management</p>
        </div>

        {error && (
          <div className="badge badge-error" style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Usuário</label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite o usuário"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
              />
              <button
                type="button"
                id="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button id="login-button" type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Entrar
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
          <p className="text-muted text-sm" style={{ textAlign: 'center', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Shield size={16} /> Contas de Demonstração
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button id="demo-owner" type="button" className="btn btn-secondary btn-sm" onClick={() => handleLogin('owner')}>Entrar como Proprietário</button>
            <button id="demo-admin" type="button" className="btn btn-secondary btn-sm" onClick={() => handleLogin('admin')}>Entrar como Administrador</button>
            <button id="demo-manager" type="button" className="btn btn-secondary btn-sm" onClick={() => handleLogin('manager')}>Entrar como Gerente</button>
            <button id="demo-staff" type="button" className="btn btn-secondary btn-sm" onClick={() => handleLogin('staff')}>Entrar como Equipe</button>
            <button id="demo-referee" type="button" className="btn btn-secondary btn-sm" onClick={() => handleLogin('referee')}>Entrar como Árbitro</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
