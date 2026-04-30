import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import API_URL from '../config.js';

const MENU_ITEMS = [
  { path: '/dashboard', icon: '📊', label: 'Mis Finanzas' },
  { path: '/reports', icon: '📝', label: 'Reportes' },
  { path: '/budgets', icon: '🎯', label: 'Presupuestos' },
  { path: '/goals', icon: '🚀', label: 'Metas' },
  { path: '/accounts', icon: '💳', label: 'Deudas' },
];

const Logo = ({ isExpanded }) => (
  <div className={`h-20 flex items-center ${isExpanded ? 'px-6' : 'justify-center'} transition-all duration-500 ease-out cursor-pointer group`}>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-t from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0 transition-all duration-700 group-hover:rotate-[360deg] group-hover:scale-110 animate-float">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-8 w-8">
          <rect width="64" height="64" rx="14" fill="#1a7a5e"/>
          <rect x="26" y="10" width="7" height="33" rx="3" fill="white"/>
          <path d="M26 42 Q26 56 18 57 Q12 58 10 53" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round"/>
          <polyline points="33,50 41,40 49,45 57,30" fill="none" stroke="#7de8c0" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="33" cy="50" r="2.5" fill="#7de8c0"/>
          <circle cx="41" cy="40" r="2.5" fill="#7de8c0"/>
          <circle cx="49" cy="45" r="2.5" fill="#7de8c0"/>
          <circle cx="57" cy="30" r="2.5" fill="#7de8c0"/>
        </svg>
      </div>
      {isExpanded && (
        <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-600 bg-clip-text text-transparent whitespace-nowrap tracking-tighter animate-fade-in">
          Jade
        </h2>
      )}
    </div>
  </div>
);

const NavMenu = ({ menuItems, currentPath, isExpanded, darkMode }) => (
  <nav className="flex-1 px-3 space-y-2 mt-6 overflow-y-auto scrollbar-hide">
    {menuItems.map(({ path, icon, label }, index) => {
      const isActive = currentPath === path;
      return (
        <Link
          key={path}
          to={path}
          className={`flex items-center ${isExpanded ? 'px-4' : 'justify-center'} py-3.5 rounded-2xl transition-all duration-300 ease-bounce group relative active:scale-90 hover-shimmer
            ${isActive
              ? (darkMode ? 'bg-indigo-500/15 text-indigo-400 shadow-inner' : 'bg-indigo-50 text-indigo-600 shadow-sm')
              : (darkMode ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900')
            } animate-slide-in`}
          style={{ animationDelay: `${index * 70}ms` }}
        >
          {isActive && (
            <div className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-indigo-500 rounded-r-full shadow-[4px_0_12px_rgba(99,102,241,0.8)] animate-pulse" />
          )}
          <span className={`text-2xl transition-transform duration-500 ease-bounce ${isActive ? 'scale-125 rotate-6' : 'group-hover:scale-110 group-hover:-rotate-12'}`}>
            {icon}
          </span>
          {isExpanded && <span className={`ml-3 font-semibold transition-all duration-300 ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>{label}</span>}
          {!isExpanded && (
            <div className="absolute left-16 px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all duration-300 shadow-2xl translate-x-4 group-hover:translate-x-0 bg-slate-900 text-white text-xs font-bold">
              {label}
            </div>
          )}
        </Link>
      );
    })}
  </nav>
);

const BottomNav = ({ menuItems, currentPath, darkMode }) => (
  <nav className={`fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2 border-t md:hidden ${
    darkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
  }`}>
    {menuItems.map(({ path, icon, label }) => {
      const isActive = currentPath === path;
      return (
        <Link
          key={path}
          to={path}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 active:scale-90 ${
            isActive
              ? (darkMode ? 'text-indigo-400' : 'text-indigo-600')
              : (darkMode ? 'text-slate-500' : 'text-slate-400')
          }`}
        >
          <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-125' : ''}`}>{icon}</span>
          <span className={`text-[10px] font-bold truncate max-w-[52px] text-center ${isActive ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
          {isActive && <div className="w-1 h-1 rounded-full bg-indigo-500 mt-0.5" />}
        </Link>
      );
    })}
  </nav>
);

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{"name":"Usuario","plan":"basic"}'));
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const handlePlanUpgrade = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(updatedUser);
    };
    window.addEventListener('storage', handlePlanUpgrade);
    return () => window.removeEventListener('storage', handlePlanUpgrade);
  }, []);

  useEffect(() => {
    const verificarPlan = async () => {
      try {
        const res = await fetch(`${API_URL}/api/payments/plan-status`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (currentUser.plan !== data.plan) {
            currentUser.plan = data.plan;
            localStorage.setItem('user', JSON.stringify(currentUser));
            setUser(currentUser);
          }
        }
      } catch (error) {
        console.error('Error verificando plan:', error);
      }
    };
    verificarPlan();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleLogout = async () => {
    const container = document.getElementById('layout-container');
    if (container) container.classList.add('opacity-0', 'scale-95', 'blur-sm');
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error en logout:', error);
    }
    setTimeout(() => {
      localStorage.removeItem('user');
      navigate('/login');
    }, 400);
  };

  const INACTIVITY_TIME = 5 * 60 * 1000;
  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { handleLogout(); }, INACTIVITY_TIME);
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const currentLabel = MENU_ITEMS.find((i) => i.path === location.pathname)?.label ?? 'Jade Finance';
  const isPremium = user?.plan === 'premium';

  return (
    <div id="layout-container" className={`flex h-screen w-full font-sans antialiased selection:bg-indigo-500 transition-all duration-700 ${
      darkMode ? 'bg-[#0B1121] text-slate-200' : 'bg-slate-50 text-slate-800'
    }`}>

      {/* ── SIDEBAR — oculto en móvil, visible en md+ ── */}
      <aside className={`hidden md:flex relative flex-col border-r transition-all duration-500 z-[60] ${
        isExpanded ? 'w-68' : 'w-24'
      } ${darkMode ? 'bg-[#111827]/80 backdrop-blur-xl border-slate-800' : 'bg-white border-slate-200 shadow-2xl shadow-slate-200/50'}`}>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`absolute -right-4 top-10 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500 hover:scale-125 active:scale-75 shadow-lg z-50 ${
            darkMode ? 'bg-slate-800 border-slate-700 text-indigo-400' : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          <span className={`transition-transform duration-700 ${isExpanded ? '' : 'rotate-180'}`}>◀</span>
        </button>

        <Logo isExpanded={isExpanded} />
        <NavMenu menuItems={MENU_ITEMS} currentPath={location.pathname} isExpanded={isExpanded} darkMode={darkMode} />

        {isExpanded && !isPremium && (
          <div className="mx-3 mb-3 p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20">
            <p className="text-xs font-black text-amber-500 mb-1">⚡ Plan Básico</p>
            <p className="text-[10px] text-slate-400 mb-3">Desbloquea funciones ilimitadas con Premium</p>
            <button
              onClick={() => navigate('/upgrade')}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition-all hover:scale-105"
            >
              Ver planes
            </button>
          </div>
        )}

        <div className="p-4 mb-4">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isExpanded ? 'px-5 gap-3' : 'justify-center'} py-4 text-rose-500 rounded-2xl font-bold transition-all duration-300 hover-wiggle hover:bg-rose-500/10 group active:scale-90`}
          >
            <span className="text-2xl group-hover:rotate-12 transition-transform">🚪</span>
            {isExpanded && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ── HEADER ── */}
        <header className={`relative z-50 h-16 md:h-20 px-4 md:px-10 flex items-center justify-between border-b transition-all duration-500 ${
          darkMode ? 'bg-[#0B1121]/50 backdrop-blur-md border-slate-800' : 'bg-white/80 backdrop-blur-md border-slate-100'
        }`}>
          <div className="flex flex-col">
            <span className={`hidden md:block text-xs font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Plataforma Principal
            </span>
            <h1 className={`text-lg md:text-2xl font-black transition-all animate-fade-in ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              {currentLabel}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            <NotificationBell userId={user.id} darkMode={darkMode} />

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 md:p-3 rounded-2xl transition-all duration-500 hover:rotate-[360deg] hover:scale-110 active:scale-90 ${
                darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-indigo-600'
              }`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            <Link
              to="/settings"
              className="flex items-center gap-2 md:gap-4 p-1.5 md:pl-4 rounded-2xl cursor-pointer group hover:bg-slate-100/10 transition-all duration-300 active:scale-95"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none truncate max-w-[100px]">{user.name}</p>
                <p className={`text-[10px] uppercase tracking-tighter font-black mt-1 ${isPremium ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {isPremium ? '⭐ Premium' : '🔓 Básico'}
                </p>
              </div>
              <div className={`w-9 h-9 md:w-11 md:h-11 rounded-2xl flex items-center justify-center text-white font-black shadow-lg transition-all duration-500 group-hover:rotate-12 overflow-hidden ${
                isPremium
                  ? 'bg-gradient-to-tr from-emerald-300 to-green-600'
                  : 'bg-gradient-to-tr from-amber-300 to-orange-500'
              }`}>
                {user.profilePic
                  ? <img src={user.profilePic} className="w-full h-full object-cover" alt="avatar" />
                  : user.name?.charAt(0)
                }
              </div>
            </Link>
          </div>
        </header>

        {/* ── CONTENIDO ── */}
        <div className="flex-1 overflow-auto px-3 py-4 md:p-8 pb-24 md:pb-8 scrollbar-hide bg-transparent">
          <div key={location.pathname} className="max-w-6xl mx-auto">

            {/* ── BANNER PREMIUM — solo en móvil para usuarios básicos ── */}
            {!isPremium && (
              <div className="md:hidden mb-4 p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-amber-500">⚡ Plan Básico</p>
                  <p className="text-[10px] text-slate-400">Desbloquea funciones ilimitadas</p>
                </div>
                <button
                  onClick={() => navigate('/upgrade')}
                  className="shrink-0 py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition-all"
                >
                  Ver planes
                </button>
              </div>
            )}

            <Outlet context={{ darkMode }} />
          </div>
        </div>
      </main>

      {/* ── BOTTOM NAV — solo en móvil ── */}
      <BottomNav menuItems={MENU_ITEMS} currentPath={location.pathname} darkMode={darkMode} />
    </div>
  );
};

export default Layout;



