import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InteractiveShaderBackground from '../components/InteractiveShaderBackground';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const cleanInput = email.trim().toLowerCase();

    // Admin Authentication -> Full Admin Access
    if (
      (cleanInput === 'admin' || cleanInput === 'admin@mis.com') &&
      (password === 'admin' || password === 'admin123')
    ) {
      localStorage.setItem('mis_role', 'admin');
      localStorage.setItem('mis_user', 'Department Administrator');
      navigate('/admin');
      return;
    }

    // Student Authentication -> Student Dashboard
    if (cleanInput) {
      localStorage.setItem('mis_role', 'student');
      localStorage.setItem('mis_user', cleanInput.split('@')[0]);
      navigate('/');
      return;
    }

    setError('Please enter valid login credentials.');
  };

  const handleGuestStudentLogin = () => {
    localStorage.setItem('mis_role', 'student');
    localStorage.setItem('mis_user', 'Student User');
    navigate('/');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-background overflow-hidden">
      <InteractiveShaderBackground />
      <div className="bg-mesh"></div>
      
      <div className="glass-card p-stack-md rounded-xl max-w-md w-full relative z-10 flex flex-col gap-5 border border-white/10 shadow-[0_0_30px_rgba(56,189,248,0.15)]">
        
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center text-primary mb-3">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </div>
          <h1 className="font-headline-md text-2xl font-bold text-on-surface">ESchedular26 | Academic MIS</h1>
          <p className="text-xs text-on-surface-variant mt-1">Authenticate to access Admin Portal or Student Dashboard.</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error/20 border border-error text-error text-xs text-center font-bold">
            {error}
          </div>
        )}

        {/* Clean Credential Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-label-bold uppercase text-on-surface-variant">Email / Username</label>
            <input
              className="input-glass p-3 rounded-lg text-on-surface text-xs font-body-md"
              type="text"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@mis.com or admin"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-label-bold uppercase text-on-surface-variant">Password</label>
            <input
              className="input-glass p-3 rounded-lg text-on-surface text-xs font-body-md"
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
            Sign In to MIS
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-3 text-[11px] font-label-bold text-on-surface-variant uppercase">OR</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        {/* Guest Student Button */}
        <button
          type="button"
          onClick={handleGuestStudentLogin}
          className="bg-surface-container border border-white/10 text-on-surface hover:bg-white/5 py-2.5 rounded-lg text-xs font-label-bold cursor-pointer flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-sm text-primary">school</span> Continue in Basic Mode
        </button>

        {/* Presets Hint Card */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-white/5 text-xs text-center font-label-bold">
          Admin Credentials: <b className="text-primary">admin</b> / <b className="text-primary">admin</b>
        </div>

      </div>
    </div>
  );
}

export default Login;
