import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import InteractiveShaderBackground from './InteractiveShaderBackground';
import { isFirebaseConfigured } from '../firebase';

function DashboardLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const role = localStorage.getItem('mis_role') || 'student';
  const isAdmin = role === 'admin';
  const isLabAdmin = role === 'lab_admin';
  const isCloudSynced = isFirebaseConfigured();

  const allNavItems = [
    { name: 'Home Dashboard', icon: 'home', path: '/' },
    { name: 'Weekly Schedule', icon: 'calendar_month', path: '/timetable' },
    { name: 'Module Tracker', icon: 'view_module', path: '/modules' },
    { name: 'Lab Tracker', icon: 'biotech', path: '/lab-tracker' },
    { name: 'Daily Lecture Logs', icon: 'history_edu', path: '/logs', adminOnly: true },
    { name: 'Audit Trail', icon: 'history', path: '/audit', adminOnly: true },
    { name: 'Admin Portal', icon: 'admin_panel_settings', path: '/admin', adminOnly: true }
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin);

  const handleLeaveAdmin = () => {
    localStorage.setItem('mis_role', 'student');
    localStorage.removeItem('mis_user');
    navigate('/');
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('mis_role');
    localStorage.removeItem('mis_user');
    navigate('/login');
  };

  return (
    <>
      <InteractiveShaderBackground />
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/5 shadow-[0_0_15px_rgba(56,189,248,0.1)]">
        <div className="flex items-center justify-between px-margin-mobile md:px-margin-desktop h-touch-target max-w-[1440px] mx-auto">
          {/* Left Logo & Menu Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="material-symbols-outlined text-primary hover:opacity-80 transition-opacity cursor-pointer p-1 rounded-lg hover:bg-white/5"
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? 'close' : 'menu'}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <h1 className="font-headline-lg-mobile md:font-headline-md font-bold text-primary tracking-tight">
                ESchedular26
              </h1>
              {isAdmin && (
                <span className="text-[10px] font-label-bold px-2 py-0.5 rounded-full border uppercase bg-secondary/10 text-secondary border-secondary/30">
                  Full Admin
                </span>
              )}
              {isLabAdmin && (
                <span className="text-[10px] font-label-bold px-2 py-0.5 rounded-full border uppercase bg-tertiary/10 text-tertiary border-tertiary/30">
                  Lab Admin
                </span>
              )}
            </Link>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Cloud Sync Status Indicator */}
            {isCloudSynced ? (
              <span className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 rounded-full bg-secondary/10 border border-secondary/30 text-secondary text-[10px] sm:text-[11px] font-label-bold" title="Connected to Firebase Realtime Cloud Database. Changes sync live across all batch mates.">
                <span className="material-symbols-outlined text-sm text-secondary animate-pulse">cloud_done</span>
                <span className="hidden xs:inline">Cloud Synced</span>
                <span className="xs:hidden">Synced</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] sm:text-[11px] font-label-bold" title="Operating in local mode. Add Firebase keys to src/firebase.js for instant multi-device batch sync.">
                <span className="material-symbols-outlined text-sm text-amber-400">cloud_off</span>
                <span className="hidden xs:inline">Local Mode</span>
                <span className="xs:hidden">Local</span>
              </span>
            )}
            {isAdmin || isLabAdmin ? (
              <button
                onClick={handleLeaveAdmin}
                className="hidden sm:flex items-center gap-1.5 bg-error/10 border border-error/30 hover:bg-error/20 px-3 py-1 rounded-full text-xs font-label-bold text-error transition-colors cursor-pointer"
                title="Exit Admin/Lab Admin Mode and return to Basic View"
              >
                <span className="material-symbols-outlined text-sm">logout</span> Leave {isLabAdmin ? 'Lab Admin' : 'Admin'}
              </button>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-1.5 btn-electric px-3 py-1 rounded-full text-xs font-label-bold"
              >
                <span className="material-symbols-outlined text-sm">login</span> Login / Modes
              </Link>
            )}

            <button className="material-symbols-outlined text-primary hover:opacity-80 transition-opacity cursor-pointer text-xl sm:text-2xl">
              notifications
            </button>

            {/* Avatar */}
            <div 
              onClick={() => navigate(isAdmin ? '/admin' : '/login')}
              className="w-8 h-8 rounded-full overflow-hidden border border-primary/30 cursor-pointer hover:border-primary transition-colors shrink-0"
              title={isAdmin ? "Logged in as Admin" : "Click to Login"}
            >
              <img
                className="w-full h-full object-cover"
                alt="User Avatar"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out Sidebar Drawer Menu (Desktop & Mobile Drawer) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          ></div>

          <nav className="relative bg-surface-container border-r border-white/10 w-4/5 max-w-xs h-full flex flex-col py-6 px-4 gap-y-4 pt-16 z-50 overflow-y-auto shadow-2xl">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">school</span>
              </div>
              <div>
                <h2 className="font-headline-md text-sm text-on-surface font-bold leading-tight">Faculty of Engineering</h2>
                <p className="text-on-surface-variant text-[11px]">ESchedular26 MIS</p>
              </div>
            </div>

            <div className="flex flex-col gap-1 flex-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-label-bold ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/30 active-glow'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/10">
              {isAdmin ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLeaveAdmin();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-error/10 border border-error/20 text-error hover:bg-error/20 transition-all text-sm font-label-bold cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
                  <span>Leave Admin Mode</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all text-sm font-label-bold cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">login</span>
                  <span>Admin Login</span>
                </button>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Persistent Sidebar Navigation */}
      <aside className="bg-surface-container/40 backdrop-blur-xl fixed left-0 top-0 h-full w-[260px] z-40 border-r border-white/5 hidden lg:flex flex-col py-8 px-4 gap-y-4 pt-20">
        <div className="flex items-center gap-3 px-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">school</span>
          </div>
          <div>
            <h2 className="font-headline-md text-sm text-on-surface font-bold leading-tight">Faculty of Eng.</h2>
            <p className="text-on-surface-variant text-[11px]">ESchedular26 MIS</p>
          </div>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer text-sm font-label-bold ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/30 active-glow'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-xl">
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto border-t border-white/10 pt-4 px-2">
          {isAdmin ? (
            <button
              onClick={handleLeaveAdmin}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-error/10 border border-error/20 text-error hover:bg-error/20 transition-all text-sm font-label-bold cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              <span>Leave Admin Mode</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all text-sm font-label-bold cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">login</span>
              <span>Admin Login</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Shell */}
      <nav className="lg:hidden fixed bottom-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-t border-white/5 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] rounded-t-xl h-[72px] flex justify-around items-center px-2 pb-safe">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 ${
            location.pathname === '/' ? 'text-primary drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'text-on-surface-variant/60 hover:text-primary/80'
          }`}
        >
          <span className="material-symbols-outlined text-xl">home</span>
          <span className="font-label-sm text-[11px]">Home</span>
        </Link>

        <Link
          to="/timetable"
          className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 ${
            location.pathname === '/timetable' ? 'text-primary drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'text-on-surface-variant/60 hover:text-primary/80'
          }`}
        >
          <span className="material-symbols-outlined text-xl">calendar_month</span>
          <span className="font-label-sm text-[11px]">Schedule</span>
        </Link>

        <Link
          to="/modules"
          className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 ${
            location.pathname === '/modules' ? 'text-primary drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'text-on-surface-variant/60 hover:text-primary/80'
          }`}
        >
          <span className="material-symbols-outlined text-xl">view_module</span>
          <span className="font-label-sm text-[11px]">Modules</span>
        </Link>

        <Link
          to="/lab-tracker"
          className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 ${
            location.pathname === '/lab-tracker' ? 'text-primary drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'text-on-surface-variant/60 hover:text-primary/80'
          }`}
        >
          <span className="material-symbols-outlined text-xl">biotech</span>
          <span className="font-label-sm text-[11px]">Labs</span>
        </Link>

        {isAdmin ? (
          <>
            <Link
              to="/logs"
              className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-90 ${
                location.pathname === '/logs' ? 'text-primary drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]' : 'text-on-surface-variant/60 hover:text-primary/80'
              }`}
            >
              <span className="material-symbols-outlined text-xl">history_edu</span>
              <span className="font-label-sm text-[11px]">Logs</span>
            </Link>

            <button
              onClick={handleLeaveAdmin}
              className="flex flex-col items-center justify-center text-error transition-all duration-200 active:scale-90 cursor-pointer"
              title="Leave Admin Mode"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              <span className="font-label-sm text-[11px]">Leave Admin</span>
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary/80 transition-all duration-200 active:scale-90"
          >
            <span className="material-symbols-outlined text-xl">login</span>
            <span className="font-label-sm text-[11px]">Login</span>
          </Link>
        )}
      </nav>

      {/* Main Container */}
      <main className="lg:ml-[260px] pt-16 pb-28 lg:pb-12 min-h-screen px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto">
        {children}
      </main>
    </>
  );
}

export default DashboardLayout;
