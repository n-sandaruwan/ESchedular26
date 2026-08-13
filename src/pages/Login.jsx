import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import InteractiveShaderBackground from '../components/InteractiveShaderBackground';

function Login() {
  const [selectedPortal, setSelectedPortal] = useState('admin'); // 'admin' | 'lab_admin'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Department Admin Authentication
    if (
      selectedPortal === 'admin' ||
      cleanUser === 'admin' ||
      cleanUser === 'admin@mis.com'
    ) {
      if (cleanPass === '987') {
        localStorage.setItem('mis_role', 'admin');
        localStorage.setItem('mis_user', 'Department Administrator');
        navigate('/admin');
        return;
      }
    }

    // 2. Lab Admin Authentication
    if (
      selectedPortal === 'lab_admin' ||
      cleanUser === 'labadmin' ||
      cleanUser === 'lab' ||
      cleanUser === 'labadmin@mis.com'
    ) {
      if (cleanPass === '654') {
        localStorage.setItem('mis_role', 'lab_admin');
        localStorage.setItem('mis_user', 'Lab Administrator');
        navigate('/lab-tracker');
        return;
      }
    }

    // Direct password fallbacks regardless of portal selection
    if (cleanPass === '987') {
      localStorage.setItem('mis_role', 'admin');
      localStorage.setItem('mis_user', 'Department Administrator');
      navigate('/admin');
      return;
    }

    if (cleanPass === '654') {
      localStorage.setItem('mis_role', 'lab_admin');
      localStorage.setItem('mis_user', 'Lab Administrator');
      navigate('/lab-tracker');
      return;
    }

    setError('Invalid username or password. Please check your credentials.');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-background overflow-hidden">
      <InteractiveShaderBackground />
      <div className="bg-mesh"></div>
      
      <div className="glass-card p-stack-md rounded-2xl max-w-md w-full relative z-10 flex flex-col gap-5 border border-white/10 shadow-[0_0_30px_rgba(56,189,248,0.15)]">
        
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center text-primary mb-3">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </div>
          <h1 className="font-headline-md text-2xl font-bold text-on-surface">ESchedular26 Portal</h1>
          <p className="text-xs text-on-surface-variant mt-1">Authorized Access for Department & Lab Administrators.</p>
        </div>

        {/* Portal Mode Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => { setSelectedPortal('admin'); setError(''); }}
            className={`py-2 px-3 rounded-lg text-xs font-label-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedPortal === 'admin'
                ? 'bg-primary/20 text-primary border border-primary/40 shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">admin_panel_settings</span> Admin Portal
          </button>

          <button
            type="button"
            onClick={() => { setSelectedPortal('lab_admin'); setError(''); }}
            className={`py-2 px-3 rounded-lg text-xs font-label-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedPortal === 'lab_admin'
                ? 'bg-secondary/20 text-secondary border border-secondary/40 shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">biotech</span> Lab Admin
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error/20 border border-error text-error text-xs text-center font-bold">
            {error}
          </div>
        )}

        {/* Secure Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-label-bold uppercase text-on-surface-variant">Username / ID</label>
            <input
              className="input-glass p-3 rounded-lg text-on-surface text-xs font-body-md focus:border-primary outline-none"
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={selectedPortal === 'admin' ? 'admin' : 'labadmin'}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-label-bold uppercase text-on-surface-variant">Password</label>
            <input
              className="input-glass p-3 rounded-lg text-on-surface text-xs font-body-md focus:border-primary outline-none"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn-electric py-3 rounded-lg font-label-bold uppercase tracking-wider text-xs mt-1 cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.3)]"
          >
            Sign In as {selectedPortal === 'admin' ? 'Administrator' : 'Lab Admin'}
          </button>
        </form>

        {/* Quick 1-Click Admin Access */}
        <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('mis_role', 'admin');
              localStorage.setItem('mis_user', 'Department Administrator');
              navigate('/admin');
            }}
            className="w-full py-2.5 rounded-lg bg-secondary/15 border border-secondary/30 text-secondary font-label-bold text-xs hover:bg-secondary/25 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(78,222,163,0.15)]"
          >
            <span className="material-symbols-outlined text-sm text-secondary">bolt</span>
            1-Click Admin Access (Passcode: 987)
          </button>
          
          <div className="text-center">
            <Link
              to="/"
              className="text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-1 font-label-bold"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span> Return to Basic Mode
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
