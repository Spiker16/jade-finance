import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext, useNavigate } from 'react-router-dom';
import PremiumModal from '../components/PremiumModal';
import AsisteChat from '../components/AsisteChat';
import API_URL from '../config.js';

const CATEGORY_MAP = {
  'Comida': '🍔',
  'Transporte': '🚌',
  'Entretenimiento': '🎬',
  'Salud': '🏥',
  'Educación': '📚',
  'Arriendo': '🏠',
  'Otros': '📦'
};

const Budgets = () => {
  const { darkMode } = useOutletContext();
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [misCategorias, setMisCategorias] = useState([]);
  const [limitReached, setLimitReached] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const [newBudget, setNewBudget] = useState({
    category: 'Comida',
    limit: '',
    emoji: '🍔'
  });

  const defaultCategories = Object.keys(CATEGORY_MAP);
  const customCategories = misCategorias.filter(cat => cat.type === 'gasto');
  const allCategoryNames = [...defaultCategories, ...customCategories.map(c => c.name)];

  // ✅ fetchBudgets acepta un signal para cancelar llamadas en vuelo
  const fetchBudgets = async (signal) => {
    try {
      const res = await fetch(`${API_URL}/api/budgets`, {
        credentials: 'include',
        signal
      });
      if (res.ok) {
        const data = await res.json();
        setBudgets(data);
      }
    } catch (error) {
      if (error.name === 'AbortError') return; // ignorar cancelaciones normales
      console.error("Error al cargar presupuestos", error);
    }
  };

  // ✅ useEffect cancela llamadas anteriores al desmontar (evita condición de carrera)
  useEffect(() => {
    const controller = new AbortController();
    fetchBudgets(controller.signal);

    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData?.categories) {
      setMisCategorias(userData.categories);
    }

    return () => controller.abort();
  }, []);

  const formatCurrencyDisplay = (val) => {
    if (val === undefined || val === null || val === '') return '0';
    const cleaned = String(val).replace(/\D/g, '');
    if (!cleaned) return '0';
    return new Intl.NumberFormat('de-DE').format(parseInt(cleaned, 10));
  };

  const handleCategoryChange = (e) => {
    const selectedName = e.target.value;
    let selectedEmoji = '💰';
    if (CATEGORY_MAP[selectedName]) {
      selectedEmoji = CATEGORY_MAP[selectedName];
    } else {
      const custom = customCategories.find(c => c.name === selectedName);
      if (custom) selectedEmoji = custom.emoji;
    }
    setNewBudget({ ...newBudget, category: selectedName, emoji: selectedEmoji });
  };

  const handleLimitChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setNewBudget({ ...newBudget, limit: rawValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing && !currentId) return;

    // ✅ Template literals corregidos
    const url = isEditing
      ? `${API_URL}/api/budgets/${currentId}`
      : `${API_URL}/api/budgets`;

    const method = isEditing ? 'PUT' : 'POST';
    const dataToSend = {
      category: newBudget.category,
      limit: Number(newBudget.limit),
      emoji: newBudget.emoji
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(dataToSend)
      });

      if (res.status === 403) {
        const data = await res.json();
        if (data.error === 'LIMIT_REACHED') {
          alert(`⭐ Función Premium: ${data.message}`);
          setLimitReached(true);
          setLimitInfo(data);
          closeModal();
          return;
        }
      }

      if (res.ok) {
        closeModal();
        // ✅ Controller fresco para el GET después de crear/editar
        const controller = new AbortController();
        fetchBudgets(controller.signal);
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  const handleDeleteClick = (id) => {
    setBudgetToDelete(id);
    setShowDeleteModal(true);
  };

  // ✅ confirmDelete con template literal y comillas corregidas
  const confirmDelete = async () => {
    if (!budgetToDelete) return;
    try {
      const res = await fetch(`${API_URL}/api/budgets/${budgetToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setBudgetToDelete(null);
        const controller = new AbortController();
        fetchBudgets(controller.signal);
      }
    } catch (error) {
      console.error("Error al eliminar presupuesto", error);
    }
  };

  const openEditModal = (budget) => {
    const idSeguro = budget._id || budget.id;
    setNewBudget({
      category: budget.category,
      limit: String(budget.limit),
      emoji: budget.emoji || '💰'
    });
    setCurrentId(idSeguro);
    setIsEditing(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentId(null);
    setNewBudget({ category: 'Comida', limit: '', emoji: '🍔' });
  };

  return (
    <div className="w-full p-4 md:p-8 animate-fade-in">

      {/* BANNER DE LÍMITE ALCANZADO */}
      {limitReached && (
        <div className="mb-8 p-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🔒</span>
            <div>
              <p className="font-black text-amber-500 text-lg">Límite del plan Básico alcanzado</p>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Has usado {limitInfo?.current} de {limitInfo?.limit} presupuestos disponibles.
                Actualiza a Premium para crear presupuestos ilimitados.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPremiumModal(true)}
            className="shrink-0 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-amber-500/30 hover:-translate-y-1"
          >
            ⚡ Ver Premium
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className={`text-2xl sm:text-4xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Mis Presupuestos</h2>
          <p className={`mt-1 text-sm sm:text-lg ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Control de gastos por categoría</p>
        </div>
        <button
          onClick={() => limitReached ? setShowPremiumModal(true) : setShowModal(true)}
          className={`px-8 py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-95 text-white ${
            limitReached
              ? 'bg-amber-500 hover:bg-amber-600'
              : 'bg-emerald-400 hover:bg-emerald-600'
          }`}
        >
          {limitReached ? '⚡ Upgrade' : '+ Nuevo Límite'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((b) => {
          const idSeguro = b._id || b.id;
          const spent = b.spent || 0;
          const limit = b.limit || 1;
          const percentageUsed = Math.min((spent / limit) * 100, 100).toFixed(1);
          const isOverLimit = spent > limit;
          const isWarning = spent >= limit * 0.8 && spent <= limit;

          return (
            <div key={idSeguro} className={`group relative p-6 md:p-8 rounded-[2rem] border shadow-xl transition-all overflow-hidden ${
              isOverLimit ? 'bg-red-500/5 border-red-500/50' : darkMode ? 'bg-[#151D2C] border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button onClick={() => openEditModal(b)} className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-colors">✏️</button>
                <button onClick={() => handleDeleteClick(idSeguro)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">🗑️</button>
              </div>

              <div className="flex items-center gap-5 mb-5 mt-4">
                <span className={`text-4xl p-4 rounded-2xl shrink-0 ${isOverLimit ? 'bg-red-500/20' : isWarning ? 'bg-yellow-500/20' : 'bg-slate-100 dark:bg-slate-900/50'}`}>
                  {b.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">CATEGORÍA</span>
                  <span className={`font-black text-lg truncate block ${darkMode ? 'text-white' : 'text-slate-800'}`}>{b.category}</span>
                  <span className="font-black text-xl text-indigo-500">${formatCurrencyDisplay(b.limit)}</span>
                </div>
              </div>

              <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                <div className={`h-full transition-all duration-1000 ${isOverLimit ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${percentageUsed}%` }} />
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <span>GASTADO: ${formatCurrencyDisplay(spent)}</span>
                  <span className={isOverLimit ? 'text-red-500' : isWarning ? 'text-yellow-500' : ''}>{percentageUsed}%</span>
                </div>
                {isOverLimit && <p className="text-red-500 text-[11px] font-bold flex items-center gap-1 animate-pulse">⚠️ LÍMITE EXCEDIDO POR ${formatCurrencyDisplay(spent - limit)}</p>}
                {!isOverLimit && isWarning && <p className="text-yellow-500 text-[11px] font-bold flex items-center gap-1">👀 ¡CUIDADO! CASI LLEGAS AL LÍMITE</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CREACIÓN/EDICIÓN */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className={`relative p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border animate-in zoom-in duration-200 ${darkMode ? 'bg-[#0B1121] border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className={`text-2xl font-black mb-8 text-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {isEditing ? 'Actualizar Límite' : 'Crear Presupuesto'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <span className="text-6xl p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl">{newBudget.emoji}</span>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-2 ml-1 text-slate-400">Categoría</label>
                <select
                  className={`w-full border rounded-2xl px-5 py-4 font-bold outline-none ${darkMode ? 'bg-[#151D2C] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  value={newBudget.category}
                  onChange={handleCategoryChange}
                  required
                >
                  {allCategoryNames.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={`w-full border rounded-2xl pl-10 pr-5 py-4 outline-none font-bold text-xl ${darkMode ? 'bg-[#151D2C] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  value={formatCurrencyDisplay(newBudget.limit)}
                  onChange={handleLimitChange}
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 font-bold text-slate-500">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all">
                  {isEditing ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
      {showDeleteModal && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowDeleteModal(false)} />
          <div className={`relative p-8 rounded-[2rem] w-full max-w-sm shadow-2xl border animate-in slide-in-from-bottom-4 duration-300 ${darkMode ? 'bg-[#0B1121] border-red-500/20' : 'bg-white border-slate-100'}`}>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className={`text-xl font-bold text-center mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>¿Eliminar presupuesto?</h3>
            <p className="text-slate-400 text-center text-sm mb-8">Esta acción no se puede deshacer y perderás el rastro de tus límites en esta categoría.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/30">Sí, eliminar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ASISTENTE JADE CON PROP DE LÍMITE */}
      <AsisteChat onLimitReached={(info) => {
        setLimitInfo(info);
        setLimitReached(true);
      }} />
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        limitInfo={{ ...limitInfo, isDarkMode: darkMode }}
      />
    </div>
  );
};

export default Budgets;