import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import InteractiveShaderBackground from '../components/InteractiveShaderBackground';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

// =========================================================================
// 🛑 IMPORTANT SECURITY CONFIGURATION 🛑
// Replace these with the actual User UIDs from your Firebase Console > Authentication
// =========================================================================
export const AUTHORIZED_UIDS = {
  ADMINS: [
    'qgGyu7Qwy6QeV9apAiz3E2NL0zE2',
    'TEwc06RhhlSYrvX5lxqj4oWqudw2',
    'b87r7LcjnHRPqNVSximVm7ntUTh1'
  ],
  LAB_ADMINS: [
    'j4MpEMaYyqRZmuxXvgI5Mjwn0zi1' // Generic Lab Admin (can switch groups)
  ]
};

// Map specific UIDs to strict Lab Groups (EE01 to EE12)
export const LAB_ADMIN_GROUP_MAP = {
  'dzL5yCg697PJWXWXTgT7X0jbfgQ2': 'EE01',
  'F4oJx4xH9OU66S3spgmrUJqilya2': 'EE02',
  '3qHUuqf8AGMmqdTy8fuwZhb3MQ12': 'EE02',
  'FW5hgHty1wbuPkGuHZB5MEtUrwx1': 'EE03',
  '1cfPgmhFEPeFycOG2uw5PNBTEzw2': 'EE04',
  '97BQMKjoSGWk3nbFsW0KinKhlx22': 'EE04',
  'gWvfBdA1JEdUPCMsw2miMnqzmeQ2': 'EE05',
  'rfGcnZkOBuNP1FIsGNPgtHLL0kg1': 'EE06',
  'gOowUjgA7XgpC368KPJH1xtrZrY2': 'EE06',
  'NlYz9zHd2zclCqWI7A2dGqjWpIS2': 'EE07',
  'bEJB23Ws7iSGi7L5J3eywyhNLci1': 'EE08',
  'oScneRpncRXgeAZL0cW5PhBZg222': 'EE09',
  'mYSY84JejeTaVQKJ7OVp5dQYiFJ2': 'EE10',
  'xMaDjWwffKYylC5nFTKPqYes5Pz1': 'EE10',
  'BOsDkGYNBvM9gEUsiuC2gZW5Hh73': 'EE11',
  'ej65wKnIQngvw5ca4n4UiUqTe2b2': 'EE12'
};

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRoleVerification = (uid) => {
    if (AUTHORIZED_UIDS.ADMINS.includes(uid)) {
      localStorage.setItem('mis_role', 'admin');
      localStorage.setItem('mis_user', 'Department Administrator');
      localStorage.removeItem('mis_lab_admin_strict');
      navigate('/admin');
    }
    else if (AUTHORIZED_UIDS.LAB_ADMINS.includes(uid) || Object.keys(LAB_ADMIN_GROUP_MAP).includes(uid)) {
      localStorage.setItem('mis_role', 'lab_admin');
      localStorage.setItem('mis_user', 'Lab Administrator');

      const assignedGroup = LAB_ADMIN_GROUP_MAP[uid];
      if (assignedGroup) {
        localStorage.setItem('mis_lab_admin_group', assignedGroup);
        localStorage.setItem('mis_lab_admin_strict', 'true');
      } else {
        localStorage.removeItem('mis_lab_admin_group');
        localStorage.removeItem('mis_lab_admin_strict');
      }

      navigate('/lab-admin-portal');
    }
    else {
      setError('Access Denied: Your account does not have administrator privileges.');
      auth.signOut();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanInput = email.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      if (!auth) throw new Error("Firebase Authentication is not configured.");

      const userCredential = await signInWithEmailAndPassword(auth, cleanInput, cleanPass);
      handleRoleVerification(userCredential.user.uid);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-email') {
        setError('Invalid username/email or password. Please check your credentials.');
      } else {
        setError(err.message || 'An error occurred during sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      if (!auth) throw new Error("Firebase Authentication is not configured.");

      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      handleRoleVerification(userCredential.user.uid);
    } catch (err) {
      console.error(err);
      // Ignore if user just closed the popup
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || 'An error occurred during Google Sign-In.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-background overflow-hidden">
      <InteractiveShaderBackground />
      <div className="bg-mesh"></div>

      <div className="glass-card p-6 sm:p-8 rounded-2xl max-w-md w-full relative z-10 flex flex-col gap-6 border dark:border-white/10 border-black/10 shadow-[0_0_30px_rgba(56,189,248,0.15)] mx-2">

        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h1 className="font-headline-md text-2xl sm:text-3xl font-bold text-on-surface">Admin Login</h1>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error text-xs sm:text-sm text-center font-bold break-all">
            {error}
          </div>
        )}

        {/* Secure Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-label-bold uppercase text-on-surface-variant tracking-wider">Username or Email</label>
            <input
              className="input-glass p-3.5 rounded-xl text-on-surface text-sm font-body-md focus:border-primary outline-none transition-all"
              type="text"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin or labadmin or Email"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-label-bold uppercase text-on-surface-variant tracking-wider">Password</label>
            <input
              className="input-glass p-3.5 rounded-xl text-on-surface text-sm font-body-md focus:border-primary outline-none transition-all"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-electric py-3.5 rounded-xl font-label-bold uppercase tracking-widest text-xs sm:text-sm mt-2 cursor-pointer shadow-lg disabled:opacity-50 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? 'Signing in...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="flex items-center gap-4 my-2">
          <div className="h-px dark:bg-white/10 bg-black/10 flex-1"></div>
          <span className="text-[10px] uppercase font-label-bold text-on-surface-variant/60 tracking-wider">or continue with</span>
          <div className="h-px dark:bg-white/10 bg-black/10 flex-1"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-surface-dim dark:bg-white/5 border dark:border-white/10 border-black/10 hover:bg-surface-container-high hover:dark:border-white/20 border-black/20 transition-all text-sm font-label-bold text-on-surface cursor-pointer disabled:opacity-50 shadow-sm active:scale-[0.98]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>

        <div className="pt-4 border-t dark:border-white/5 border-black/5 flex flex-col gap-3 mt-1">
          <div className="text-center">
            <Link
              to="/"
              className="text-xs sm:text-sm text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-1.5 font-label-bold group"
            >
              <span className="material-symbols-outlined text-sm sm:text-base group-hover:-translate-x-1 transition-transform">arrow_back</span> Go with Basic Mode
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
