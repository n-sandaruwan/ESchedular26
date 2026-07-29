import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function DashboardLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = localStorage.getItem('mis_role') || 'student';
  const isAdmin = role === 'admin';

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/' },
    { name: 'Semester Timetable', icon: 'calendar_month', path: '/timetable' },
    { name: 'Daily Logs Grid', icon: 'table_chart', path: '/logs' },
    { name: 'Student Portal', icon: 'person_search', path: '/student-lookup' },
    { name: 'Audit Trail', icon: 'history', path: '/audit' },
    { name: 'Admin Portal', icon: 'admin_panel_settings', path: '/admin', protected: true }
  ];

  const handleLogout = () => {
    localStorage.removeItem('mis_role');
    localStorage.removeItem('mis_user');
    navigate('/login');
  };

  return (
    <>
      {/* Desktop Top Header Navigation */}
      <header className="bg-surface/80 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-glass-stroke shadow-sm hidden md:block">
        <div className="flex justify-between items-center h-16 px-[40px] w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-4">
            <span className="font-display-lg text-[26px] text-electric-blue tracking-tight leading-none font-bold">Academic MIS</span>
            <span className={`text-[10px] font-label-mono px-2.5 py-0.5 rounded-full border font-bold uppercase ${
              isAdmin
                ? 'bg-emerald-glow/20 text-emerald-glow border-emerald-glow/40'
                : 'bg-electric-blue/20 text-electric-blue border-electric-blue/40'
            }`}>
              {isAdmin ? 'Admin Mode' : 'Student Read-Only'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin ? (
              <div className="flex items-center gap-2 bg-emerald-glow/10 border border-emerald-glow/30 px-3 py-1.5 rounded-full text-xs font-label-mono text-emerald-glow">
                <span className="w-2 h-2 rounded-full bg-emerald-glow animate-pulse"></span>
                Authenticated Admin
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-electric px-3.5 py-1.5 rounded-full text-xs font-bold font-label-mono flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">login</span> Admin Login
              </Link>
            )}

            <div className="w-9 h-9 rounded-full bg-surface-container-high border border-glass-stroke overflow-hidden cursor-pointer">
              <img alt="User Avatar" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Header Navigation */}
      <header className="bg-surface/90 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-glass-stroke shadow-md md:hidden px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-surface-container border border-glass-stroke text-electric-blue cursor-pointer"
            aria-label="Toggle Mobile Menu"
          >
            <span className="material-symbols-outlined text-lg">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
          <span className="font-display-lg text-base text-electric-blue font-bold tracking-tight">Academic MIS</span>
        </div>

        <span className={`text-[9px] font-label-mono px-2 py-0.5 rounded-full border font-bold uppercase ${
          isAdmin
            ? 'bg-emerald-glow/20 text-emerald-glow border-emerald-glow/40'
            : 'bg-electric-blue/20 text-electric-blue border-electric-blue/40'
        }`}>
          {isAdmin ? 'Admin' : 'Student'}
        </span>
      </header>

      {/* Mobile Slide-out Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          ></div>

          <nav className="relative bg-surface-container-lowest border-r border-glass-stroke w-4/5 max-w-xs h-full flex flex-col py-6 px-4 gap-y-4 pt-16 z-50 overflow-y-auto shadow-2xl">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-electric-blue/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-electric-blue text-xl">school</span>
              </div>
              <div>
                <h2 className="font-headline-md text-sm text-on-surface font-bold leading-tight">Faculty of Engineering</h2>
                <p className="text-on-surface-variant text-[11px]">Department MIS</p>
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
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-electric-blue/15 text-electric-blue font-bold border border-electric-blue/30'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                    {item.protected && !isAdmin && (
                      <span className="material-symbols-outlined text-xs text-coral-vibe ml-auto">lock</span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t border-glass-stroke">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all text-sm font-medium cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                <span>{isAdmin ? 'Logout Admin' : 'Switch Role / Login'}</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <nav className="bg-surface-container-lowest/60 backdrop-blur-xl fixed left-0 top-0 h-full w-[280px] z-40 border-r border-glass-stroke shadow-lg hidden md:flex flex-col py-8 px-4 gap-y-4 pt-24">
        <div className="flex items-center gap-4 px-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary/10 border border-electric-blue/30 flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-electric-blue" style={{ fontSize: '28px' }}>school</span>
          </div>
          <div>
            <h2 className="font-headline-md text-[17px] text-on-surface leading-tight font-bold">Faculty of Engineering</h2>
            <p className="text-on-surface-variant text-xs font-body-md mt-0.5">Department MIS</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path} 
                className={`flex items-center gap-3 px-4 py-3 rounded-r-full transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? 'bg-primary-container/20 text-electric-blue border-r-4 border-electric-blue font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'
                }`}
              >
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                <span className="font-body-md text-sm">{item.name}</span>
                {item.protected && !isAdmin && (
                  <span className="material-symbols-outlined text-xs text-coral-vibe ml-auto" title="Admin Auth Required">lock</span>
                )}
              </Link>
            );
          })}
        </div>
        
        <div className="mt-auto border-t border-glass-stroke pt-4 px-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-r-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 transition-all duration-200 group cursor-pointer"
          >
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">logout</span>
            <span className="font-body-md text-sm">{isAdmin ? 'Logout Admin' : 'Switch Role / Login'}</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Quick Navigation Dock */}
      <nav className="fixed bottom-0 left-0 w-full bg-surface-container-lowest/95 backdrop-blur-2xl border-t border-glass-stroke z-40 md:hidden flex items-center justify-around px-2 py-1.5 shadow-2xl">
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
            location.pathname === '/' ? 'text-electric-blue font-bold' : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-xl">dashboard</span>
          <span className="text-[10px] font-label-mono">Home</span>
        </Link>

        <Link
          to="/timetable"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
            location.pathname === '/timetable' ? 'text-electric-blue font-bold' : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-xl">calendar_month</span>
          <span className="text-[10px] font-label-mono">Schedule</span>
        </Link>

        <Link
          to="/logs"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
            location.pathname === '/logs' ? 'text-electric-blue font-bold' : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-xl">table_chart</span>
          <span className="text-[10px] font-label-mono">Logs</span>
        </Link>

        <Link
          to="/student-lookup"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
            location.pathname === '/student-lookup' ? 'text-electric-blue font-bold' : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-xl">person_search</span>
          <span className="text-[10px] font-label-mono">Student</span>
        </Link>

        <Link
          to={isAdmin ? '/admin' : '/login'}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
            location.pathname === '/admin' ? 'text-emerald-glow font-bold' : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-xl">{isAdmin ? 'admin_panel_settings' : 'lock'}</span>
          <span className="text-[10px] font-label-mono">{isAdmin ? 'Admin' : 'Login'}</span>
        </Link>
      </nav>

      {/* Main Container */}
      <main className="md:ml-[280px] pt-16 md:pt-16 pb-24 md:pb-10 min-h-screen p-3 sm:p-5 md:p-[40px] max-w-[1440px] mx-auto">
        {children}
      </main>
    </>
  );
}

export default DashboardLayout;
