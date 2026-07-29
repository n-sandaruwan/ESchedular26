import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (email.trim() === "admin@mis.com" && password === "admin123") {
      localStorage.setItem("mis_role", "admin");
      localStorage.setItem("mis_user", "Department Administrator");
      navigate("/admin");
    } else if (email.trim()) {
      localStorage.setItem("mis_role", "student");
      localStorage.setItem("mis_user", email.split('@')[0]);
      navigate("/");
    } else {
      setError("Please enter valid login credentials.");
    }
  };

  const handleGuestStudentLogin = () => {
    localStorage.setItem("mis_role", "student");
    localStorage.setItem("mis_user", "Student Guest");
    navigate("/");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-background overflow-hidden">
      <div className="bg-mesh"></div>
      
      <form onSubmit={handleLogin} className="glass-panel p-8 rounded-xl max-w-md w-full relative z-10 flex flex-col gap-5 border border-glass-stroke shadow-[0_0_30px_rgba(0,212,255,0.15)]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-electric-blue/15 border border-electric-blue/30 mx-auto flex items-center justify-center text-electric-blue mb-3">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </div>
          <h1 className="font-display-lg text-2xl font-bold text-on-surface">Department MIS Portal</h1>
          <p className="text-xs text-on-surface-variant mt-1">Authenticate to access Admin Control Center or Student Dashboard.</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-coral-vibe/20 border border-coral-vibe text-coral-vibe text-xs text-center font-semibold">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-label-mono uppercase text-on-surface-variant">Email / Username</label>
          <input
            className="input-glass p-3 rounded-lg text-on-surface text-xs font-body-md"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@mis.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-label-mono uppercase text-on-surface-variant">Password</label>
          <input
            className="input-glass p-3 rounded-lg text-on-surface text-xs font-body-md"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" className="btn-electric py-3 rounded-lg font-bold uppercase tracking-wider text-xs mt-1 cursor-pointer">
          Sign In to MIS
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-glass-stroke"></div>
          <span className="flex-shrink mx-3 text-[11px] font-label-mono text-on-surface-variant uppercase">OR</span>
          <div className="flex-grow border-t border-glass-stroke"></div>
        </div>

        <button
          type="button"
          onClick={handleGuestStudentLogin}
          className="bg-surface-container-high border border-glass-stroke text-on-surface hover:bg-surface-container py-2.5 rounded-lg text-xs font-bold font-label-mono cursor-pointer flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm text-electric-blue">school</span> Continue as Student (Read-Only)
        </button>

        <div className="p-3 rounded-lg bg-surface-container-lowest border border-glass-stroke text-[11px] font-label-mono text-on-surface-variant text-center">
          Admin Credentials: <b className="text-electric-blue">admin@mis.com</b> / <b className="text-electric-blue">admin123</b>
        </div>
      </form>
    </div>
  );
}

export default Login;
