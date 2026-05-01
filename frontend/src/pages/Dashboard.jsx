// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import PremiumModal from '../components/PremiumModal'; 
import AsisteChat from '../components/AsisteChat';
import API_URL from '../config.js';
const Dashboard = () => {
  const context = useOutletContext();
  const darkMode = context?.darkMode ?? false;
  
  // Obtenemos el usuario para saber visualmente si es premium
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const isPremiumUser = user.plan === 'premium';

  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); 
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('🍔 Comida');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [misCategorias, setMisCategorias] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toLocaleDateString('en-CA')); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sugerencia, setSugerencia] = useState(null);
  const [loadingSugerencia, setLoadingSugerencia] = useState(false);

  // ESTADOS PARA LÍMITES DE PLAN
  const [limitReached, setLimitReached] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);

  // Categorías fijas
  const expenseCategories = ['🍔 Comida', '🚌 Transporte', '🎬 Entretenimiento', '🏥 Salud', '📚 Educación', '🏠 Arriendo', '📦 Otros'];
  const incomeCategories = ['💼 Salario', '💻 Freelance', '📈 Inversiones', '🎁 Regalo', '🏠 Arriendamiento', '💰 Otros Ingresos'];
  
  const customFiltered = misCategorias
    .filter(cat => (type === 'expense' ? cat.type === 'gasto' : cat.type === 'ingreso'))
    .map(cat => `${cat.emoji} ${cat.name}`);

  const categories = useMemo(() => {
  return type === 'expense'
    ? [...expenseCategories, ...customFiltered]
    : [...incomeCategories, ...customFiltered];
  }, [type, misCategorias]);

  const EXPENSE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#e11d48', '#fb7185', '#dc2626', '#fca5a5'];
  const INCOME_COLORS = ['#22c55e', '#16a34a', '#4ade80', '#10b981', '#06b6d4', '#3b82f6'];

  useEffect(() => {
    const syncData = async () => {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData && userData.categories) {
        setMisCategorias(userData.categories);
      }

      try {
        const res = await fetch(`${API_URL}/api/user/categories`, {
          credentials: 'include'
        });
        if (res.ok) {
          const freshCategories = await res.json();
          setMisCategorias(freshCategories);
          if (userData) {
            userData.categories = freshCategories;
            localStorage.setItem('user', JSON.stringify(userData));
          }
        }
      } catch (error) {
        console.error("Error refrescando categorías del servidor", error);
      }
    };

    fetchTransactions();
    fetchAllTransactions();
    syncData();

    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user'));
      if (updatedUser?.categories) setMisCategorias(updatedUser.categories);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ==========================================
  // LÓGICA DE CATEGORIZACIÓN IA (CORREGIDA PREMIUM)
  // ==========================================
  useEffect(() => {
    if (!description || description.length < 3) {
      setSugerencia(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingSugerencia(true);
      try {
        const res = await fetch(`${API_URL}/api/ai/categorizar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ descripcion: description, categorias: categories })
        });

        // Si es 403, simplemente no hay sugerencia (Silencioso para no molestar al escribir)
        if (res.status === 403) {
          setSugerencia(null);
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setSugerencia(data.categoria);
        }
      } catch (error) {
        console.error('Error al sugerir categoría', error);
      } finally {
        setLoadingSugerencia(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [description, categories]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/transactions`, {
          credentials: 'include'
        });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error al cargar datos", error);
    }
  };

    const fetchAllTransactions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/transactions/all`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAllTransactions(data);
      }
    } catch (error) {
      console.error("Error al cargar saldo histórico", error);
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setType(newType);
    setCategory(newType === 'expense' ? expenseCategories[0] : incomeCategories[0]);
  };

  const formatCOP = (num) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(num);
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue.length > 13) return; 
    
    if (!rawValue) {
      setAmount('');
      return;
    }
    const formattedValue = new Intl.NumberFormat('es-CO').format(rawValue);
    setAmount(formattedValue);
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setEditingId(null);
    setSugerencia(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const rawAmount = Number(amount.replace(/\./g, '').replace(',', '.'));

    if (rawAmount > 1000000000000) {
      alert('⚠️ El monto es demasiado grande. El límite es 1 Billón.');
      setIsSubmitting(false);
      return;
    }

    if (!rawAmount || isNaN(rawAmount) || rawAmount <= 0) {
      alert('Por favor ingresa un monto válido');
      setIsSubmitting(false);
      return;
    }

    const payload = { amount: rawAmount, type, category, description };

    try {
      const url = editingId 
       ? `${API_URL}/api/transactions/${editingId}` 
        : `${API_URL}/api/transactions`;
      
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      // MANEJO DE LÍMITES DE PLAN (403)
      if (res.status === 403) {
        const data = await res.json();
        setLimitInfo(data);
        setLimitReached(true);
        setIsSubmitting(false);
        return;
      }

      if (res.ok) {
        fetchTransactions();
        resetForm();
        triggerSuccess();
      }
    } catch (error) {
      console.error("Error al guardar", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2000);
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id || transaction._id);
    setAmount(new Intl.NumberFormat('es-CO').format(Math.abs(transaction.amount)));
    setType(transaction.type);
    setCategory(transaction.category);
    setDescription(transaction.description || '');
  };

  const handleDelete = async (id) => {
    if(!window.confirm("¿Estás seguro de eliminar este registro?")) return;
    try {
      const res = await fetch(`${API_URL}/api/transactions/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      if (res.ok) {
        setTransactions(transactions.filter(t => t.id !== id && t._id !== id));
      }
    } catch (error) {
      console.error("Error al eliminar", error);
    }
  };

  const totalBalance = transactions.reduce((acc, curr) => {
    const monto = Number(curr.amount);
    return curr.type === 'income' ? acc + monto : acc - monto;
  }, 0);

  // ==========================================
  // LÓGICA DE GRÁFICOS (TU CÓDIGO ORIGINAL)
  // ==========================================
  const buildPieData = (filterType) => {
    const filtered = transactions.filter(t => t.type === filterType);
    const totals = {};
    filtered.forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + Math.abs(Number(t.amount));
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  };

  const expensePieData = buildPieData('expense');
  const incomePieData  = buildPieData('income');

  const buildArcs = (data, colors) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return [];
    let cumulative = 0;
    return data.map((d, i) => {
      const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
      cumulative += d.value;
      const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
      const cx = 80, cy = 80, r = 65, ri = 38; 
      const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
      const ix1 = cx + ri * Math.cos(endAngle), iy1 = cy + ri * Math.sin(endAngle);
      const ix2 = cx + ri * Math.cos(startAngle), iy2 = cy + ri * Math.sin(startAngle);
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${ri} ${ri} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
      return { path, color: colors[i % colors.length], name: d.name, value: d.value, pct: Math.round((d.value / total) * 100) };
    });
  };

  const DonutChart = ({ data, label, total, color, colors }) => {
    const [hovered, setHovered] = useState(null);
    const arcs = buildArcs(data, colors);
    return (
      <div className={`p-5 rounded-3xl border shadow-sm ${themeClasses.card} flex flex-col gap-4 transition-all hover:shadow-md`}>
        <h3 className={`text-base font-bold ${themeClasses.textTitle}`}>{label}</h3>
        {data.length === 0 ? (
          <p className={`text-center py-8 text-sm opacity-90 italic ${themeClasses.textMuted}`}>Sin registros aún</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative shrink-0">
              <svg width="160" height="160" viewBox="0 0 160 160">
                {arcs.map((arc, i) => (
                  <path key={i} d={arc.path} fill={arc.color} opacity={hovered === null || hovered === i ? 1 : 0.35} className="transition-opacity duration-200 cursor-pointer" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
                ))}
                <text x="80" y="75" textAnchor="middle" className="text-xs" fill={darkMode ? '#f3f4f6' : '#1f2937'} fontSize="11" fontWeight="700">
                  {hovered !== null ? `${arcs[hovered].pct}%` : 'Total'}
                </text>
                <text x="80" y="91" textAnchor="middle" fill={color} fontSize="10" fontWeight="800">
                  {hovered !== null ? formatCOP(arcs[hovered].value) : formatCOP(total)}
                </text>
              </svg>
            </div>
            <ul className="flex flex-col gap-2 w-full">
              {arcs.map((arc, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-xs cursor-pointer hover:scale-105 transition-transform origin-left" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: arc.color }} />
                    <span className={`truncate font-medium ${themeClasses.textTitle}`}>{arc.name}</span>
                  </div>
                  <span className="font-bold shrink-0" style={{ color: arc.color }}>{arc.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const totalIncome   = transactions.filter(t => t.type === 'income').reduce((a, c) => a + Number(c.amount), 0);
  const totalExpense  = transactions.filter(t => t.type === 'expense').reduce((a, c) => a + Number(c.amount), 0);

  const filteredTransactions = transactions.filter(t => {
    if (!filterDate) return true;
    const tDate = new Date(t.createdAt).toLocaleDateString('en-CA'); 
    return tDate === filterDate;
  });

  const groupedTransactions = filteredTransactions.reduce((acc, t) => {
    const dateStr = new Date(t.createdAt).toLocaleDateString('es-CO', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(t);
    return acc;
  }, {});

  const themeClasses = {
    card: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100',
    textTitle: darkMode ? 'text-gray-100' : 'text-gray-800',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
    input: darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-indigo-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-indigo-500',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 mt-8 px-4 pb-8">
      {/* SECCIÓN SALDO */}
      <div className={`p-8 rounded-3xl border shadow-sm text-center overflow-hidden ${themeClasses.card}`}>
        <h2 className={`text-sm font-bold tracking-widest uppercase mb-2 ${themeClasses.textMuted}`}>Saldo Disponible</h2>
       <p key={totalBalance} className={`text-3xl md:text-5xl font-black animate-pop w-full block px-2 text-center ${totalBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {formatCOP(totalBalance)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FORMULARIO */}
        <div className={`p-6 rounded-3xl border shadow-sm ${themeClasses.card}`}>
          <h3 className={`text-xl font-bold mb-4 ${themeClasses.textTitle}`}>
            {editingId ? '✏️ Editar Movimiento' : 'Nuevo Movimiento'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className={`text-xs font-bold ml-1 ${themeClasses.textMuted}`}>MONTO</label>
              <input type="text" value={amount} onChange={handleAmountChange} required placeholder="50.000" className={`w-full p-3 border rounded-2xl outline-none transition-colors ${themeClasses.input}`} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className={`text-xs font-bold ${themeClasses.textMuted}`}>DESCRIPCIÓN</label>
                {!isPremiumUser && <span className="text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-black">👑 IA PREMIUM</span>}
              </div>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Ej. Cena, Gasolina..." className={`w-full p-3 border rounded-2xl outline-none transition-colors ${themeClasses.input}`} />
              
              {loadingSugerencia && (
                <p className="text-xs text-indigo-400 ml-2 animate-pulse">🤖 IA analizando...</p>
              )}
              {sugerencia && !loadingSugerencia && (
                <button
                  type="button"
                  onClick={() => setCategory(sugerencia)}
                  className="text-xs ml-2 px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 font-bold hover:bg-indigo-500 hover:text-white transition-all animate-pop"
                >
                  ✨ Sugerencia: {sugerencia} — clic para aplicar
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={`text-xs font-bold ml-1 ${themeClasses.textMuted}`}>TIPO</label>
                <select value={type} onChange={handleTypeChange} className={`w-full p-3 border rounded-2xl outline-none ${themeClasses.input}`}>
                  <option value="expense">Gasto 📉</option>
                  <option value="income">Ingreso 📈</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={`text-xs font-bold ml-1 ${themeClasses.textMuted}`}>CATEGORÍA</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full p-3 border rounded-2xl outline-none ${themeClasses.input}`}>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full text-white font-bold py-3 rounded-2xl transition-all duration-300 shadow-lg ${isSuccess 
                  ? 'bg-indigo-600 scale-95 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : editingId 
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30 hover:-translate-y-1' 
                  : 'bg-emerald-400 hover:bg-emerald-600 shadow-emerald-500/30 hover:-translate-y-1'
                }`}
              >
                {isSuccess ? '¡Completado! ✨' : isSubmitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Registrar'}
              </button>
              
              {editingId && (
                <button type="button" onClick={resetForm} className="w-1/3 bg-gray-500 text-white font-bold py-3 rounded-2xl hover:bg-gray-600 transition-all">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* HISTORIAL */}
        <div className={`p-6 rounded-3xl border shadow-sm flex flex-col overflow-hidden ${themeClasses.card}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <h3 className={`text-xl font-bold ${themeClasses.textTitle}`}>Historial Diario</h3>
            <div className="flex items-center gap-2 w-full sm:w-auto relative group">
              <input 
                type="date" 
                value={filterDate} 
                onChange={(e) => setFilterDate(e.target.value)}
                style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                className={`text-xs p-2.5 pr-8 rounded-xl border outline-none cursor-pointer transition-all w-full sm:w-36 font-semibold
                  ${darkMode ? 'bg-gray-700/50 border-gray-600 hover:border-indigo-400' : 'bg-gray-50 border-gray-200 hover:border-indigo-500'} 
                  ${themeClasses.textTitle}`}
              />
            </div>
          </div>

          <div className="space-y-6 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
            {Object.keys(groupedTransactions).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 opacity-50">
                <span className="text-4xl mb-2">🍃</span>
                <p className={`text-sm italic text-center ${themeClasses.textMuted}`}>No hay registros aún.</p>
              </div>
            ) : (
              Object.entries(groupedTransactions).map(([date, txs]) => (
                <div key={date} className="space-y-3">
                  <h4 className={`text-[10px] font-black uppercase tracking-widest opacity-60 border-b pb-1 flex justify-between items-center ${themeClasses.textTitle}`}>
                    {date}
                  </h4>
                  {txs.map(t => (
                    <div key={t.id || t._id} className={`animate-slide-in flex justify-between items-center p-3 rounded-2xl border transition-all hover:scale-[1.01] ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-50 bg-gray-100/50'}`}>
                      <div className="flex-1 min-w-0 mr-4">
                        <p className={`font-bold text-sm truncate ${themeClasses.textTitle}`}>{t.category}</p>
                        <p className={`text-xs font-medium opacity-80 truncate ${themeClasses.textTitle}`}>{t.description}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`font-bold text-sm truncate max-w-[100px] ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.type === 'income' ? '+' : '-'} {formatCOP(t.amount)}
                        </span>
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(t)} className="p-1.5 hover:bg-amber-500/20 rounded-lg transition-colors">✏️</button>
                          <button onClick={() => handleDelete(t.id || t._id)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors">🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DonutChart data={expensePieData} label="📊 Gastos por Categoría" total={totalExpense} color="#f43f5e" colors={EXPENSE_COLORS} />
        <DonutChart data={incomePieData} label="📊 Ingresos por Categoría" total={totalIncome} color="#10b981" colors={INCOME_COLORS} />
      </div>

      {/* ASISTENTE JADE CON PROP DE LÍMITE */}
      <AsisteChat onLimitReached={(info) => {
        setLimitInfo(info);
        setLimitReached(true);
      }} />
      
      {/* MODAL DE PREMIUM */}
      <PremiumModal 
        isOpen={limitReached} 
        onClose={() => setLimitReached(false)} 
        limitInfo={limitInfo} 
      />
    </div>
  );
};

export default Dashboard;



