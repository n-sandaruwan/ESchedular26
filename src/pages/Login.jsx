import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import InteractiveShaderBackground from '../components/InteractiveShaderBackground';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

// =========================================================================
// 🛑 IMPORTANT SECURITY CONFIGURATION 🛑
// Replace these with the actual User UIDs from your Firebase Console > Authentication
// =========================================================================
export const AUTHORIZED_UIDS = {
  ADMIN: 'ADMIN_UID_GOES_HERE',       // Replace with UID for admin@eschedular26.com
  LAB_ADMIN: 'LAB_ADMIN_UID_GOES_HERE' // Replace with UID for labadmin@eschedular26.com
};

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      if (!auth) {
        throw new Error("Firebase Authentication is not configured.");
      }

      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      const uid = userCredential.user.uid;

      // 2. Role Verification
      if (uid === AUTHORIZED_UIDS.ADMIN) {
        localStorage.setItem('mis_role', 'admin');
        localStorage.setItem('mis_user', 'Department Administrator');
        navigate('/admin');
      } 
      else if (uid === AUTHORIZED_UIDS.LAB_ADMIN) {
        localStorage.setItem('mis_role', 'lab_admin');
        localStorage.setItem('mis_user', 'Lab Administrator');
        localStorage.removeItem('mis_lab_admin_group'); // Force group selection on new login
        navigate('/lab-admin-portal');
      } 
      else {
        // Logged in but UID is not authorized as Admin or Lab Admin
        setError("Access Denied: Your account does not have administrator privileges.");
        // We should log them back out
        auth.signOut();
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setError(err.message || 'An error occurred during sign in.');
      }
    } finally {
      setLoading(false);
    }
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
              placeholder="Username / ID"
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
              <span className="material-symbols-outlined text-sm">arrow_back</span> Go with Basic Mode
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
