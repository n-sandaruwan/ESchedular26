import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import InteractiveShaderBackground from '../components/InteractiveShaderBackground';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Full Department Admin Authentication
    if (cleanUser === 'admin' || cleanUser === 'admin@mis.com') {
      if (cleanPass === '987321' || cleanPass === '987') {
        localStorage.setItem('mis_role', 'admin');
        localStorage.setItem('mis_user', 'Department Administrator');
        navigate('/admin');
        return;
      }
    }

    // 2. Lab Admin Authentication
    if (
      cleanUser === 'labadmin' ||
      cleanUser === 'lab' ||
      cleanUser === 'labadmin@mis.com'
    ) {
      if (cleanPass === '654') {
        localStorage.setItem('mis_role', 'lab_admin');
        localStorage.setItem('mis_user', 'Lab Administrator');
        navigate('/lab-tracker?tab=leader');
        return;
      }
    }

    // Password-based direct fallbacks
    if (cleanPass === '987321' || cleanPass === '987') {
      localStorage.setItem('mis_role', 'admin');
      localStorage.setItem('mis_user', 'Department Administrator');
      navigate('/admin');
      return;
    }

    if (cleanPass === '654') {
      localStorage.setItem('mis_role', 'lab_admin');
      localStorage.setItem('mis_user', 'Lab Administrator');
      navigate('/lab-tracker?tab=leader');
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
          <h1 className="font-headline-md text-2xl font-bold text-on-surface">Admin Login</h1>
          <p className="text-xs text-on-surface-variant mt-1">Authorized Access for Department & Lab Administrators</p>
        </div>

        {/* Credentials Guidance Directions Card */}
        <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl space-y-2 text-xs font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-primary pb-1.5 border-b border-white/5">
            <span className="font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">admin_panel_settings</span> Full Admin:
            </span>
            <span className="text-[11px] text-on-surface-variant">User: <strong className="text-primary">admin</strong> | Pass: <strong className="text-primary">987321</strong></span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-secondary pt-0.5">
            <span className="font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">biotech</span> Lab Admin:
            </span>
            <span className="text-[11px] text-on-surface-variant">User: <strong className="text-secondary">labadmin</strong> | Pass: <strong className="text-secondary">654</strong></span>
          </div>
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
              placeholder="e.g. admin or labadmin"
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
            Sign In to Portal
          </button>
        </form>

        <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
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
