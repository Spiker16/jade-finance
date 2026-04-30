import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import PremiumModal from '../components/PremiumModal';
import AsisteChat from '../components/AsisteChat';
import API_URL from '../config.js';

const Goals = () => {
  const { darkMode } = useOutletContext() || { darkMode: true };
  const navigate = useNavigate();

  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [limitReached, setLimitReached] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [amountToAdd, setAmountToAdd] = useState('');

  const [editName, setEditName] = useState('');
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editIcon, setEditIcon] = useState('🎯');

  const ICONS = ['🎯', '✈️', '🏍️', '💻', '🏠', '🛡️', '📱', '🎓', '🏥'];

  const formatCOP = (num) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(num || 0);

  const handleTargetAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) { setTargetAmount(''); return; }
    setTargetAmount(new Intl.NumberFormat('es-CO').format(rawValue));
  };

  const handleEditTargetAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) { setEditTargetAmount(''); return; }
    setEditTargetAmount(new Intl.NumberFormat('es-CO').format(rawValue));
  };

  const handleAmountToAddChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) { setAmountToAdd(''); return; }
    setAmountToAdd(new Intl.NumberFormat('es-CO').format(rawValue));
  };

  useEffect(() => { fetchGoals(); }, []);

  // ✅ localhost reemplazado por API_URL
  const fetchGoals = async () => {
    try {
      const res = await fetch(`${API_URL}/api/goals`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (error) {
      console.error("Error al cargar metas", error);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      // ✅ localhost reemplazado por API_URL
      const res = await fetch(`${API_URL}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: name,
          targetAmount: Number(targetAmount.toString().replace(/\D/g, '')),
          emoji: icon
        })
      });

      if (res.status === 403) {
        const data = await res.json();
        if (data.error === 'LIMIT_REACHED') {
          setLimitReached(true);
          setLimitInfo(data);
          setShowForm(false);
          return;
        }
      }

      if (res.ok) {
        const newGoal = await res.json();
        setGoals([newGoal, ...goals]);
        setShowForm(false);
        setName(''); setTargetAmount(''); setIcon('🎯');
      }
    } catch (error) {
      console.error("Error al crear meta", error);
    }
  };

  const openEditModal = (goal) => {
    setSelectedGoal(goal);
    setEditName(goal.title || goal.name || '');
    setEditTargetAmount(new Intl.NumberFormat('es-CO').format(goal.targetAmount));
    setEditIcon(goal.emoji || '🎯');
    setShowEditModal(true);
  };

  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    const goalId = selectedGoal._id || selectedGoal.id;
    try {
      // ✅ Template literal y comillas corregidas
      const res = await fetch(`${API_URL}/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editName,
          targetAmount: Number(editTargetAmount.toString().replace(/\D/g, '')),
          emoji: editIcon
        })
      });
      if (res.ok) {
        const updatedGoal = await res.json();
        setGoals(goals.map(g => (g._id || g.id) === goalId ? updatedGoal : g));
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Error al actualizar meta", error);
    }
  };

  const submitAddMoney = async () => {
    const amount = Number(amountToAdd.toString().replace(/\D/g, ''));
    if (isNaN(amount) || amount <= 0) return alert('Ingresa una cantidad válida.');
    const goalId = selectedGoal._id || selectedGoal.id;
    try {
      // ✅ Template literal y comillas corregidas
      const res = await fetch(`${API_URL}/api/goals/${goalId}/add`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount })
      });
      if (res.ok) {
        const updatedGoal = await res.json();
        setGoals(goals.map(g => (g._id || g.id) === goalId ? updatedGoal : g));
        setShowAddModal(false);
        setAmountToAdd('');
      }
    } catch (error) {
      console.error("Error al abonar", error);
    }
  };

  const confirmDelete = async () => {
    const goalId = selectedGoal._id || selectedGoal.id;
    try {
      // ✅ Template literal y comillas corregidas
      const res = await fetch(`${API_URL}/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        setGoals(goals.filter(g => (g._id || g.id) !== goalId));
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error("Error al eliminar", error);
    }
  };

  const themeClasses = {
    card: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100',
    textTitle: darkMode ? 'text-gray-100' : 'text-gray-800',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
    progressBg: darkMode ? 'bg-gray-700' : 'bg-gray-100',
    input: darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-indigo-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-indigo-500',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 mt-8 px-4 pb-8">

      {/* BANNER DE LÍMITE */}
      {limitReached && (
        <div className="p-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🔒</span>
            <div>
              <p className="font-black text-amber-500 text-lg">Límite del plan Básico alcanzado</p>
              <p className={`text-sm ${themeClasses.textMuted}`}>
                Has usado {limitInfo?.current} de {limitInfo?.limit} metas disponibles.
                Actualiza a Premium para crear metas ilimitadas.
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

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-xl sm:text-3xl font-black ${themeClasses.textTitle}`}>Mis Metas 🚀</h1>
          <p className={`text-sm sm:text-base ${themeClasses.textMuted}`}>Aquí ahorras para tus sueños ✨</p>
        </div>
        <button
          onClick={() => limitReached ? setShowPremiumModal(true) : setShowForm(!showForm)}
          className={`font-bold py-3 px-6 rounded-2xl shadow-lg transition-all text-white ${
            limitReached ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-400 hover:bg-emerald-600'
          }`}
        >
          {limitReached ? '⚡ Upgrade' : showForm ? 'Cancelar' : '+ Nueva Meta'}
        </button>
      </div>

      {/* FORM CREACIÓN */}
      {showForm && !limitReached && (
        <form onSubmit={handleCreateGoal} className={`p-6 rounded-3xl border shadow-sm ${themeClasses.card}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej. Viaje a Cartagena" className={`p-3 border rounded-2xl outline-none ${themeClasses.input}`} />
            <input type="text" value={targetAmount} onChange={handleTargetAmountChange} required placeholder="Monto objetivo" className={`p-3 border rounded-2xl outline-none ${themeClasses.input}`} />
            <select value={icon} onChange={(e) => setIcon(e.target.value)} className={`p-3 border rounded-2xl outline-none ${themeClasses.input}`}>
              {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <button type="submit" className="mt-4 bg-emerald-500 text-white font-bold py-2 px-6 rounded-xl hover:bg-emerald-600 transition-all">Guardar Meta</button>
        </form>
      )}

      {/* LISTADO DE METAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const goalId = goal._id || goal.id;
          const displayTitle = goal.title || goal.name || "Meta sin nombre";
          const displayIcon = goal.emoji || "🎯";
          const current = Number(goal.currentAmount) || 0;
          const target = Number(goal.targetAmount) || 1;
          const percentage = Math.min((current / target) * 100, 100);
          const isCompleted = percentage >= 100;

          return (
            <div key={goalId} className={`p-6 rounded-3xl border shadow-sm transition-all hover:-translate-y-1 ${themeClasses.card}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-4xl bg-indigo-500/10 p-3 rounded-2xl">{displayIcon}</span>
                  <div>
                    <h3 className={`text-xl font-bold ${themeClasses.textTitle}`}>{displayTitle}</h3>
                    <p className={`text-sm font-medium ${isCompleted ? 'text-emerald-500' : themeClasses.textMuted}`}>
                      {isCompleted ? '¡Meta Completada! 🎉' : 'En progreso...'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(goal)} className="p-2 rounded-xl transition-colors hover:bg-indigo-500 hover:text-white">✏️</button>
                  <button onClick={() => { setSelectedGoal(goal); setShowDeleteModal(true); }} className="p-2 rounded-xl transition-colors hover:bg-red-500 hover:text-white">🗑️</button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className={themeClasses.textTitle}>{formatCOP(current)}</span>
                  <span className={themeClasses.textMuted}>de {formatCOP(target)}</span>
                </div>
                <div className={`h-4 w-full rounded-full overflow-hidden ${themeClasses.progressBg}`}>
                  <div className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${
                    isCompleted ? 'from-emerald-400 to-emerald-600' : percentage >= 50 ? 'from-indigo-500 to-emerald-400' : 'from-indigo-500 to-purple-500'
                  }`} style={{ width: `${percentage}%` }} />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs font-bold ${themeClasses.textMuted}`}>{percentage.toFixed(1)}%</span>
                  {!isCompleted && (
                    <button onClick={() => { setSelectedGoal(goal); setShowAddModal(true); }} className="text-sm font-bold text-indigo-500 hover:text-indigo-400 transition-colors">Abonar +</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL EDITAR META */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`p-8 rounded-[2rem] w-full max-w-md shadow-2xl ${themeClasses.card}`}>
            <h2 className={`text-2xl font-black mb-6 ${themeClasses.textTitle}`}>Editar Meta ✏️</h2>
            <form onSubmit={handleUpdateGoal} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1 ml-1">NOMBRE</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className={`w-full p-4 border rounded-2xl outline-none ${themeClasses.input}`} />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1 ml-1">MONTO OBJETIVO</label>
                <input type="text" value={editTargetAmount} onChange={handleEditTargetAmountChange} required className={`w-full p-4 border rounded-2xl outline-none ${themeClasses.input}`} />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1 ml-1">ICONO</label>
                <select value={editIcon} onChange={(e) => setEditIcon(e.target.value)} className={`w-full p-4 border rounded-2xl outline-none ${themeClasses.input}`}>
                  {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 rounded-2xl font-bold bg-gray-500/20">Cancelar</button>
                <button type="submit" className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ABONO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`p-8 rounded-[2rem] w-full max-w-md shadow-2xl ${themeClasses.card}`}>
            <h2 className={`text-2xl font-black mb-2 ${themeClasses.textTitle}`}>Sumar a tu ahorro 💰</h2>
            <p className={`mb-6 text-sm ${themeClasses.textMuted}`}>¿Cuánto vas a guardar para {selectedGoal?.title || selectedGoal?.name}?</p>
            <input type="text" value={amountToAdd} onChange={handleAmountToAddChange} autoFocus placeholder="Ej: 50.000" className={`w-full p-4 border rounded-2xl text-lg font-bold outline-none mb-6 ${themeClasses.input}`} />
            <div className="flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-2xl font-bold bg-gray-500/20">Cancelar</button>
              <button onClick={submitAddMoney} className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`p-8 rounded-[2rem] w-full max-w-md shadow-2xl border-2 border-rose-500/20 ${themeClasses.card}`}>
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-3xl mb-6">⚠️</div>
            <h2 className={`text-2xl font-black mb-2 ${themeClasses.textTitle}`}>¿Eliminar meta?</h2>
            <p className={`mb-8 ${themeClasses.textMuted}`}>
              Estás a punto de borrar <span className="font-bold text-rose-500">{selectedGoal?.title || selectedGoal?.name}</span>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-2xl font-bold bg-gray-500/20">No, volver</button>
              <button onClick={confirmDelete} className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-bold shadow-lg shadow-rose-500/30">Sí, eliminar</button>
            </div>
          </div>
        </div>
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

export default Goals;