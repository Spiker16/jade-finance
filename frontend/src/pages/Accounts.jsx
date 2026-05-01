import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import PremiumModal from '../components/PremiumModal';
import AsisteChat from '../components/AsisteChat';
import API_URL from '../config.js';

const Accounts = () => {
  const context = useOutletContext();
  const darkMode = context?.darkMode ?? false;
  const navigate = useNavigate();
  
  // ✅ URLs correctas
  const DEBTS_URL = `${API_URL}/api/debts`;
  const TX_URL = `${API_URL}/api/transactions`;
  const TX_ALL_URL = `${API_URL}/api/transactions/all`; // ✅ Ruta histórica

  const [debts, setDebts] = useState([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [limitReached, setLimitReached] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [paymentModal, setPaymentModal] = useState({ show: false, debtId: null, debtName: '', type: 'now', editId: null });
  const [debtEditModal, setDebtEditModal] = useState({ show: false, debt: null });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewTab, setViewTab] = useState({});
  const [paymentError, setPaymentError] = useState(null); 

  const themeClasses = {
    card: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100',
    textTitle: darkMode ? 'text-gray-100' : 'text-gray-800',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
    input: darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-indigo-400' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-indigo-500',
  };

  useEffect(() => { 
    fetchDebts(); 
    fetchTransactions(); 
  }, []);

  // ✅ Bug 1 corregido: usa /api/transactions/all para saldo histórico
  const fetchTransactions = async () => {
    try {
      const res = await fetch(TX_ALL_URL, { credentials: 'include' });
      if (res.ok) {
        const txs = await res.json();
        const incomes = txs.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
        const expenses = txs.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
        setAvailableBalance(incomes - expenses);
      }
    } catch (error) { console.error("❌ Error al cargar saldo:", error); }
  };

  const fetchDebts = async () => {
    try {
      const res = await fetch(DEBTS_URL, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDebts(data);
      }
    } catch (error) { console.error("❌ Error al cargar deudas:", error); }
  };

  const formatCOP = (num) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(num);

  const formatNumber = (val) => {
    const rawValue = String(val).replace(/\D/g, '');
    return rawValue ? new Intl.NumberFormat('es-CO').format(rawValue) : '';
  };

  const handleAmountChange = (e, setter) => setter(formatNumber(e.target.value));

  const getLocalDate = (dateString) => {
    if (!dateString) return null;
    const datePart = typeof dateString === 'string' ? dateString.split('T')[0] : dateString;
    const [year, month, day] = datePart.split('-');
    return new Date(year, month - 1, day);
  };

  const handleCreateDebt = async (e) => {
    e.preventDefault();
    if (limitReached) return setShowPremiumModal(true);

    const payload = {
      name,
      totalAmount: Number(totalAmount.replace(/\./g, '')),
      dueDate: dueDate || null
    };

    try {
      const res = await fetch(DEBTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.status === 403) {
        const data = await res.json();
        if (data.error === 'LIMIT_REACHED') {
          setLimitReached(true);
          setLimitInfo(data);
          return;
        }
      }

      if (res.ok) {
        fetchDebts();
        setName(''); setTotalAmount(''); setDueDate('');
      } else {
        const errorText = await res.text();
        console.error(`❌ Error ${res.status}:`, errorText);
      }
    } catch (error) { 
      console.error("❌ Error de red:", error); 
    }
  };

  // ✅ Bug 2 corregido: URL completa con /api/debts/
  const handleUpdateDebt = async (e) => {
    e.preventDefault();
    const debtId = debtEditModal.debt?._id || debtEditModal.debt?.id;
    if (!debtId) return console.error("ID de deuda no encontrado");

    try {
      const res = await fetch(`${DEBTS_URL}/${debtId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: debtEditModal.debt.name,
          totalAmount: Number(String(debtEditModal.debt.totalAmount).replace(/\D/g, '')),
          dueDate: debtEditModal.debt.dueDate || null
        })
      });
      if (res.ok) { 
        fetchDebts(); 
        setDebtEditModal({ show: false, debt: null }); 
      } else {
        console.error(`❌ Error ${res.status} al actualizar`);
      }
    } catch (error) { console.error("Error al actualizar", error); }
  };

  const handleCompleteScheduled = async (debtId, paymentId, amount) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Confirmar Pago?',
      message: `¿Estás seguro de que ya pagaste estos ${formatCOP(amount)}?`,
      onConfirm: async () => {
        try {
          // ✅ Bug 2 corregido
          const res = await fetch(`${DEBTS_URL}/${debtId}/payments/${paymentId}/complete`, {
            method: 'PATCH',
            credentials: 'include'
          });
          if (res.ok) { 
            fetchDebts(); 
            fetchTransactions(); 
          }
        } catch (error) { console.error(error); }
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  // ✅ Bug 2 corregido
  const handleDeleteDebt = (id) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar compromiso?',
      message: '¿Estás seguro de que deseas eliminar esta deuda y todo su historial?',
      onConfirm: async () => {
        try {
          const res = await fetch(`${DEBTS_URL}/${id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          if (res.ok) fetchDebts();
        } catch (error) { console.error(error); }
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  // ✅ Bug 2 corregido
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(paymentAmount.replace(/\D/g, ''));
    const isEdit = paymentModal.type === 'edit';
    const isSchedule = paymentModal.type === 'schedule';
    const isNow = paymentModal.type === 'now';

    if (isNow && amountNum > availableBalance) {
      setPaymentError(`Intentas abonar ${formatCOP(amountNum)} pero solo tienes ${formatCOP(availableBalance)}.`);
      return;
    }

    let url = `${DEBTS_URL}/${paymentModal.debtId}/payments`;
    if (isEdit) url = `${DEBTS_URL}/${paymentModal.debtId}/payments/${paymentModal.editId}`;
    if (isSchedule) url = `${DEBTS_URL}/${paymentModal.debtId}/schedule`;

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: amountNum, date: paymentDate })
      });

      if (res.ok) {
        if (isNow) {
          await fetch(TX_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              amount: amountNum,
              type: 'expense',
              category: '💳 Deudas',
              description: `Abono a: ${paymentModal.debtName}`
            })
          });
          fetchTransactions();
        }
        fetchDebts();
        setPaymentModal({ show: false });
        setPaymentAmount('');
      }
    } catch (error) { console.error(error); }
  };

  // ✅ Bug 2 corregido
  const handleDeletePayment = (debtId, paymentId) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar este abono?',
      message: '¿Estás seguro de eliminar este movimiento?',
      onConfirm: async () => {
        try {
          const res = await fetch(`${DEBTS_URL}/${debtId}/payments/${paymentId}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          if (res.ok) { 
            fetchDebts(); 
            fetchTransactions(); 
          }
        } catch (error) { console.error("Error al borrar pago", error); }
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  const groupedDebts = debts.reduce((groups, debt) => {
    let monthLabel = 'Sin fecha límite';
    if (debt.dueDate) {
      const localDate = getLocalDate(debt.dueDate);
      if (localDate && !isNaN(localDate)) {
        monthLabel = localDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      }
    }
    if (!groups[monthLabel]) groups[monthLabel] = [];
    groups[monthLabel].push(debt);
    return groups;
  }, {});

  const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

  const sortedMonths = Object.keys(groupedDebts).sort((a, b) => {
    if (a === 'Sin fecha límite') return 1;
    if (b === 'Sin fecha límite') return -1;
    const cleanA = a.toLowerCase().replace(' de ', ' ').split(' ');
    const cleanB = b.toLowerCase().replace(' de ', ' ').split(' ');
    const yearA = parseInt(cleanA[1]);
    const yearB = parseInt(cleanB[1]);
    if (yearA !== yearB) return yearA - yearB;
    return monthNames.indexOf(cleanA[0]) - monthNames.indexOf(cleanB[0]);
  });

  const totalDebtValue = debts.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalPaidValue = debts.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 mt-4 px-4 pb-12 relative z-10">

      {limitReached && (
        <div className="p-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🔒</span>
            <div>
              <p className="font-black text-amber-500 text-lg">Límite del plan Básico alcanzado</p>
              <p className={`text-sm ${themeClasses.textMuted}`}>
                Has usado {limitInfo?.current} de {limitInfo?.limit} deudas disponibles. Actualiza para más.
              </p>
            </div>
          </div>
          <button onClick={() => setShowPremiumModal(true)} className="shrink-0 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl transition-all shadow-lg">⚡ Ver Premium</button>
        </div>
      )}

      {/* RESUMEN SUPERIOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-6 rounded-3xl border shadow-sm text-center ${themeClasses.card}`}>
          <p className={`text-xs font-bold uppercase mb-1 ${themeClasses.textMuted}`}>Saldo Disponible</p>
          <p className="text-2xl font-black text-indigo-500">{formatCOP(availableBalance)}</p>
        </div>
        <div className={`p-6 rounded-3xl border shadow-sm text-center ${themeClasses.card}`}>
          <p className={`text-xs font-bold uppercase mb-1 ${themeClasses.textMuted}`}>Deuda Global</p>
          <p className="text-2xl font-black text-rose-500">{formatCOP(totalDebtValue)}</p>
        </div>
        <div className={`p-6 rounded-3xl border shadow-sm text-center ${themeClasses.card}`}>
          <p className={`text-xs font-bold uppercase mb-1 ${themeClasses.textMuted}`}>Total Abonado</p>
          <p className="text-2xl font-black text-emerald-500">{formatCOP(totalPaidValue)}</p>
        </div>
        <div className={`p-6 rounded-3xl border shadow-sm text-center ${themeClasses.card}`}>
          <p className={`text-xs font-bold uppercase mb-1 ${themeClasses.textMuted}`}>Deuda Pendiente</p>
          <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{formatCOP(totalDebtValue - totalPaidValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* FORMULARIO DE CREACIÓN */}
        <div className={`lg:col-span-4 p-6 rounded-3xl border shadow-sm h-fit lg:sticky lg:top-4 ${themeClasses.card}`}>
          <h3 className={`text-xl font-bold mb-6 ${themeClasses.textTitle}`}>💳 Registrar Deuda</h3>
          <form onSubmit={handleCreateDebt} className="space-y-4">
            <div>
              <label className={`text-xs font-bold block mb-1 ml-1 ${themeClasses.textMuted}`}>CONCEPTO</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej. Tarjeta" disabled={limitReached} className={`w-full p-3 border rounded-2xl outline-none ${themeClasses.input}`} />
            </div>
            <div>
              <label className={`text-xs font-bold block mb-1 ml-1 ${themeClasses.textMuted}`}>VALOR TOTAL</label>
              <input type="text" value={totalAmount} onChange={(e) => handleAmountChange(e, setTotalAmount)} required placeholder="0" disabled={limitReached} className={`w-full p-3 border rounded-2xl outline-none ${themeClasses.input}`} />
            </div>
            <div>
              <label className={`text-xs font-bold block mb-1 ml-1 ${themeClasses.textMuted}`}>FECHA LÍMITE</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required disabled={limitReached} style={{ colorScheme: darkMode ? 'dark' : 'light' }} className={`w-full p-3 border rounded-2xl outline-none ${themeClasses.input}`} />
            </div>
            <button type="submit" className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-all ${limitReached ? 'bg-amber-500' : 'bg-emerald-400 hover:bg-emerald-600'}`}>
              {limitReached ? '⚡ Upgrade a Premium' : 'Crear Compromiso'}
            </button>
          </form>
        </div>

        {/* LISTADO AGRUPADO */}
        <div className="lg:col-span-8 space-y-4">
          {sortedMonths.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border border-dashed ${themeClasses.textMuted}`}>No hay deudas registradas.</div>
          ) : (
            sortedMonths.map((month) => (
              <details key={month} className="group" open>
                <summary className={`list-none cursor-pointer p-4 mb-4 rounded-2xl flex justify-between items-center font-bold shadow-sm ${darkMode ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                  <span className="capitalize text-lg">{month}</span>
                  <span className="transform transition-transform group-open:rotate-180">▼</span>
                </summary>

                <div className="space-y-4 mb-6">
                  {groupedDebts[month].map(debt => {
                    const debtId = debt._id || debt.id;
                    const progress = Math.min(((debt.paidAmount || 0) / debt.totalAmount) * 100, 100);
                    const isPaid = progress >= 100;
                    const currentTab = viewTab[debtId] || 'history';

                    return (
                      <div key={debtId} className={`p-6 rounded-3xl border shadow-sm ${themeClasses.card}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className={`text-lg font-black ${themeClasses.textTitle}`}>{debt.name}</h4>
                            <p className={`text-xs ${themeClasses.textMuted}`}>
                              {debt.dueDate ? `Vence: ${getLocalDate(debt.dueDate).toLocaleDateString()}` : 'Sin fecha límite'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setDebtEditModal({ show: true, debt: { ...debt, id: debtId, totalAmount: formatNumber(debt.totalAmount) } })} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">✏️</button>
                            {!isPaid && (
                              <button onClick={() => { setPaymentModal({ show: true, debtId: debtId, debtName: debt.name, type: 'now' }); setPaymentAmount(''); }} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">
                                + Abonar
                              </button>
                            )}
                            <button onClick={() => handleDeleteDebt(debtId)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl">🗑️</button>
                          </div>
                        </div>

                        <div className="mb-6">
                          <div className="flex justify-between text-xs font-bold mb-2">
                            <span className={isPaid ? 'text-emerald-500' : 'text-indigo-500'}>
                              {formatCOP(debt.paidAmount)} / {formatCOP(debt.totalAmount)}
                            </span>
                            <span className={themeClasses.textMuted}>{progress.toFixed(0)}%</span>
                          </div>
                          <div className={`w-full h-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} overflow-hidden`}>
                            <div className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${isPaid ? 'from-emerald-400 to-emerald-600' : 'from-indigo-500 to-purple-500'}`} style={{ width: `${progress}%` }} />
                          </div>
                        </div>

                        <details className="border-t border-gray-100 dark:border-gray-700 pt-4 group/history cursor-pointer">
                          <summary className={`text-xs font-bold list-none flex justify-between items-center mb-2 ${themeClasses.textMuted}`}>
                            <span>HISTORIAL Y PROGRAMADOS</span>
                            <span className="transform transition-transform group-open/history:rotate-180">▼</span>
                          </summary>
                          <div className="pt-2">
                            <div className="flex gap-6 mb-4">
                              <button onClick={(e) => { e.preventDefault(); setViewTab({...viewTab, [debtId]: 'history'}); }} className={`text-xs font-black pb-1 ${currentTab === 'history' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-400'}`}>REALIZADOS</button>
                              <button onClick={(e) => { e.preventDefault(); setViewTab({...viewTab, [debtId]: 'scheduled'}); }} className={`text-xs font-black pb-1 ${currentTab === 'scheduled' ? 'border-b-2 border-indigo-500 text-indigo-500' : 'text-gray-400'}`}>PROGRAMADOS</button>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                              {currentTab === 'history' ? (
                                debt.payments?.filter(p => p.status !== 'programado').map((p) => (
                                  <div key={p._id} className={`flex justify-between items-center p-3 rounded-2xl ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                                    <div>
                                      <span className="text-[10px] font-bold text-gray-400 block">{getLocalDate(p.date).toLocaleDateString()}</span>
                                      <span className="text-sm font-bold text-emerald-500">+{formatCOP(p.amount)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => { setPaymentModal({ show: true, debtId: debtId, debtName: debt.name, type: 'edit', editId: p._id }); setPaymentAmount(formatNumber(p.amount)); setPaymentDate(new Date(p.date).toISOString().split('T')[0]); }} className="p-2 text-gray-400 hover:text-indigo-500 rounded-xl">✏️</button>
                                      <button onClick={() => handleDeletePayment(debtId, p._id)} className="p-2 text-rose-300 hover:bg-rose-500/10 rounded-xl">🗑️</button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                debt.payments?.filter(p => p.status === 'programado').map((p) => (
                                  <div key={p._id} className={`flex justify-between items-center p-3 rounded-2xl border border-dashed ${darkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-indigo-50/10'}`}>
                                    <div>
                                      <p className="text-[10px] font-black text-indigo-500 uppercase">Vence: {getLocalDate(p.date).toLocaleDateString()}</p>
                                      <p className={`text-sm font-bold ${themeClasses.textTitle}`}>{formatCOP(p.amount)}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => handleCompleteScheduled(debtId, p._id, p.amount)} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-xl">✔️</button>
                                      <button onClick={() => handleDeletePayment(debtId, p._id)} className="p-2 text-rose-300 hover:bg-rose-500/10 rounded-xl">🗑️</button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </details>
                      </div>
                    );
                  })}
                </div>
              </details>
            ))
          )}
        </div>
      </div>

      {/* MODAL EDITAR DEUDA */}
      {debtEditModal.show && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className={`w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl ${themeClasses.card}`}>
            <h3 className={`text-2xl font-black mb-6 ${themeClasses.textTitle}`}>Editar Compromiso</h3>
            <form onSubmit={handleUpdateDebt} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 ml-1">NOMBRE</label>
                <input type="text" value={debtEditModal.debt.name} onChange={(e) => setDebtEditModal({...debtEditModal, debt: {...debtEditModal.debt, name: e.target.value}})} className={`w-full p-4 border rounded-2xl outline-none ${themeClasses.input}`} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 ml-1">MONTO TOTAL</label>
                <input type="text" value={debtEditModal.debt.totalAmount} onChange={(e) => setDebtEditModal({...debtEditModal, debt: {...debtEditModal.debt, totalAmount: formatNumber(e.target.value)}})} className={`w-full p-4 border rounded-2xl outline-none ${themeClasses.input}`} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 ml-1">FECHA LÍMITE</label>
                <input type="date" value={debtEditModal.debt.dueDate ? debtEditModal.debt.dueDate.split('T')[0] : ''} onChange={(e) => setDebtEditModal({...debtEditModal, debt: {...debtEditModal.debt, dueDate: e.target.value}})} style={{ colorScheme: darkMode ? 'dark' : 'light' }} className={`w-full p-4 border rounded-2xl outline-none ${themeClasses.input}`} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setDebtEditModal({show: false})} className={`flex-1 py-4 rounded-2xl font-bold ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'}`}>Cancelar</button>
                <button type="submit" className="flex-1 py-4 rounded-2xl font-bold text-white bg-indigo-600 shadow-lg">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ABONAR */}
      {paymentModal.show && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className={`w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl relative ${themeClasses.card} animate-in fade-in zoom-in duration-200`}>
            <button onClick={() => { setPaymentModal({ show: false }); setPaymentError(null); }} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-500/10 transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className={`text-2xl font-black mb-1 ${themeClasses.textTitle}`}>
              {paymentModal.type === 'edit' ? 'Editar Abono' : 'Nuevo Abono'}
            </h3>
            <p className={`text-sm mb-6 ${themeClasses.textMuted}`}>
              Para: <span className="text-indigo-500 font-bold">{paymentModal.debtName}</span>
            </p>
            
            <form onSubmit={handlePaymentSubmit} className="space-y-5">
              {paymentModal.type !== 'edit' && (
                <div className={`flex p-1 rounded-2xl ${darkMode ? 'bg-gray-900' : 'bg-gray-200'}`}>
                  <button type="button" onClick={() => { setPaymentModal({...paymentModal, type: 'now'}); setPaymentError(null); }} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${paymentModal.type === 'now' ? (darkMode ? 'bg-gray-700 text-indigo-400 shadow-sm' : 'bg-white text-indigo-600 shadow-sm') : (darkMode ? 'text-gray-500' : 'text-gray-500')}`}>
                    Pagar Ahora
                  </button>
                  <button type="button" onClick={() => { setPaymentModal({...paymentModal, type: 'schedule'}); setPaymentError(null); }} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${paymentModal.type === 'schedule' ? (darkMode ? 'bg-gray-700 text-indigo-400 shadow-sm' : 'bg-white text-indigo-600 shadow-sm') : (darkMode ? 'text-gray-500' : 'text-gray-500')}`}>
                    Programar
                  </button>
                </div>
              )}

              {paymentError && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                  <p className="text-xs font-black text-rose-500 uppercase mb-1">❌ Saldo Insuficiente</p>
                  <p className="text-[11px] text-rose-400 font-medium leading-tight">{paymentError}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1">VALOR</label>
                <input type="text" value={paymentAmount} onChange={(e) => { handleAmountChange(e, setPaymentAmount); setPaymentError(null); }} required placeholder="0" className={`w-full p-4 border rounded-2xl outline-none text-2xl font-black text-center ${themeClasses.input} ${paymentError ? 'border-rose-500 ring-4 ring-rose-500/10' : ''}`} />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1">FECHA</label>
                <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required style={{ colorScheme: darkMode ? 'dark' : 'light' }} className={`w-full p-4 border rounded-2xl outline-none ${themeClasses.input}`} />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setPaymentModal({ show: false }); setPaymentError(null); }} className={`flex-1 py-4 rounded-2xl font-bold ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancelar</button>
                <button type="submit" className="flex-1 py-4 rounded-2xl font-bold text-white shadow-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AsisteChat onLimitReached={(info) => { setLimitInfo(info); setLimitReached(true); }} />
      <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })} />
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} limitInfo={{ ...limitInfo, isDarkMode: darkMode }} />
    </div>
  );
};

export default Accounts;