// frontend/src/pages/Reports.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import PremiumModal from '../components/PremiumModal';
import AsisteChat from '../components/AsisteChat';
import API_URL from '../config.js';
const Reports = () => {
  const { darkMode } = useOutletContext() || { darkMode: true };
  const [transactions, setTransactions] = useState([]);
  const [limitInfo, setLimitInfo] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
  try {
    const res = await fetch(`${API_URL}/api/transactions/all`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setTransactions(data);
    }
  } catch (error) {
    console.error("Error al cargar datos", error);
  }
  };

  const formatCOP = (num) => {
    // Protección por si el número es infinito o inválido
    if (!isFinite(num)) return 'Monto excedido';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(num || 0);
  };

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.createdAt);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  const { totalIncome, totalExpense } = useMemo(() => {
  return filteredTransactions.reduce(
    (acc, curr) => {
      const monto = Number(String(curr.amount).replace(/\./g, ''));
      if (curr.type === 'income') acc.totalIncome += monto;
      else acc.totalExpense += monto;
      return acc;
    },
    { totalIncome: 0, totalExpense: 0 }
  );
  }, [filteredTransactions]);

  const netBalance = totalIncome - totalExpense;

  const checkExportPermission = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reports/can-export`, { credentials: 'include' });
      if (res.status === 403) {
        const data = await res.json();
        setLimitInfo(data);
        setShowPremiumModal(true);
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  const exportToCSV = async () => {
    if (!(await checkExportPermission())) return;
    if (filteredTransactions.length === 0) return alert('No hay datos.');
    const headers = ['Fecha', 'Tipo', 'Categoria', 'Monto'];
    const rows = filteredTransactions.map(t => [new Date(t.createdAt).toLocaleDateString(), t.type, t.category, t.amount]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_${months[selectedMonth]}.csv`;
    link.click();
  };

  const exportToPDF = async () => {
    if (!(await checkExportPermission())) return;
    if (filteredTransactions.length === 0) return alert('No hay datos.');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><style>
        body { font-family: sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .income { color: green; } .expense { color: red; }
      </style></head><body>
      <h2>Reporte Financiero - ${months[selectedMonth]} ${selectedYear}</h2>
      <table>
        <tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Monto</th></tr>
        ${filteredTransactions.map(t => `
          <tr>
            <td>${new Date(t.createdAt).toLocaleDateString()}</td>
            <td class="${t.type === 'income' ? 'income' : 'expense'}">${t.type === 'income' ? 'Ingreso' : 'Gasto'}</td>
            <td>${t.category}</td>
            <td>${formatCOP(t.amount)}</td>
          </tr>
        `).join('')}
      </table>
      <p><b>Balance: ${formatCOP(netBalance)}</b></p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const dailyData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, income: 0, expense: 0 }));
    filteredTransactions.forEach(t => {
      const day = new Date(t.createdAt).getDate();
      if (t.type === 'income') days[day - 1].income += t.amount;
      else days[day - 1].expense += t.amount;
    });
    
    // Protección contra el "Infinito"
    let maxAmount = Math.max(...days.map(d => Math.max(d.income, d.expense)), 1); 
    if (!isFinite(maxAmount)) maxAmount = 1; // Evita que las gráficas colapsen

    return days.map(d => ({ ...d, iH: (d.income / maxAmount) * 100, eH: (d.expense / maxAmount) * 100 }));
  }, [filteredTransactions, selectedMonth, selectedYear]);

  const theme = {
    card: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100',
    text: darkMode ? 'text-gray-100' : 'text-gray-800',
    muted: darkMode ? 'text-gray-400' : 'text-gray-500',
    input: darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 mt-8 px-4 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-black ${theme.text}`}>Reportes 📊</h1>
          <p className={theme.muted}>Análisis mensual de tu flujo de caja</p>
        </div>
        <div className="flex flex-col gap-3 w-full md:w-auto">
          <div className="flex gap-2">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className={`p-2 rounded-xl text-sm font-bold outline-none border ${theme.input}`}>
              {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className={`p-2 rounded-xl text-sm font-bold outline-none border ${theme.input}`}>
              {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={exportToCSV} className="flex-1 bg-emerald-600 hover:bg-emerald-500 transition-colors text-white px-3 py-2 rounded-xl font-bold text-xs">📥 Excel</button>
            <button onClick={exportToPDF} className="flex-1 bg-rose-600 hover:bg-rose-500 transition-colors text-white px-3 py-2 rounded-xl font-bold text-xs">📄 PDF</button>
          </div>
        </div>
      </div>

      {/* TARJETAS RESUMEN (Truncadas para evitar desbordamiento) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-5 rounded-3xl border ${theme.card} overflow-hidden`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>Ingresos</span>
          <p className="text-xl font-black text-emerald-500 truncate" title={formatCOP(totalIncome)}>{formatCOP(totalIncome)}</p>
        </div>
        <div className={`p-5 rounded-3xl border ${theme.card} overflow-hidden`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>Gastos</span>
          <p className="text-xl font-black text-rose-500 truncate" title={formatCOP(totalExpense)}>{formatCOP(totalExpense)}</p>
        </div>
        <div className={`p-5 rounded-3xl border ${theme.card} overflow-hidden`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>Balance</span>
          <p className={`text-xl font-black truncate ${netBalance >= 0 ? 'text-indigo-500' : 'text-orange-500'}`} title={formatCOP(netBalance)}>{formatCOP(netBalance)}</p>
        </div>
      </div>

      {/* GRÁFICO DIARIO */}
      <div className={`p-6 rounded-3xl border ${theme.card}`}>
        <h3 className={`text-sm font-bold mb-4 ${theme.text}`}>Flujo de Efectivo Diario</h3>
        
        {/* Contenedor del gráfico con scroll horizontal */}
        <div className="h-48 w-full overflow-x-auto custom-scrollbar pb-2">
          <div className="flex items-end justify-between gap-1 h-full min-w-[600px] px-2">
            {dailyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                
                {/* Tooltip Hover */}
                <div className={`absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-50 w-max p-2 rounded-xl shadow-2xl text-[10px] font-bold border ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
                  <span className="opacity-70">Día {d.day}</span>
                  <span className="text-emerald-500">+{formatCOP(d.income)}</span>
                  <span className="text-rose-500">-{formatCOP(d.expense)}</span>
                </div>

                <div className="flex gap-[1px] items-end h-32 w-full justify-center">
                  <div className="w-1.5 md:w-2 bg-emerald-500 rounded-t-sm transition-all duration-300 hover:brightness-110" style={{ height: `${d.iH}%`, minHeight: d.income > 0 ? '4px' : '0' }}></div>
                  <div className="w-1.5 md:w-2 bg-rose-500 rounded-t-sm transition-all duration-300 hover:brightness-110" style={{ height: `${d.eH}%`, minHeight: d.expense > 0 ? '4px' : '0' }}></div>
                </div>
                <span className={`text-[9px] mt-2 font-bold ${theme.muted}`}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex justify-center gap-6 mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className={`text-xs font-bold ${theme.muted}`}>Ingresos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className={`text-xs font-bold ${theme.muted}`}>Gastos</span>
          </div>
        </div>

      </div>
      {/* ASISTENTE JADE CON PROP DE LÍMITE */}
      <AsisteChat onLimitReached={(info) => {
        setLimitInfo(info);
        setLimitReached(true);
      }} />
      {/* MODAL PREMIUM */}
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} limitInfo={{ ...limitInfo, isDarkMode: darkMode }} />
    </div>
  );
};

export default Reports;



