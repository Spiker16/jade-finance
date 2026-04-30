import React from 'react';
import { useNavigate } from 'react-router-dom';


const PremiumModal = ({ isOpen, onClose, limitInfo }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    navigate('/upgrade');
  };

  const themeClasses = {
    overlay: 'fixed inset-0 z-[9999] flex items-center justify-center p-4',
    backdrop: 'absolute inset-0 bg-black/70 backdrop-blur-md',
    modal: 'relative p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border animate-in zoom-in duration-200',
    darkBg: 'bg-[#0B1121] border-amber-500/20',
    lightBg: 'bg-white border-amber-200',
    iconBg: 'bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4',
    title: 'text-2xl font-black text-center mb-2',
    darkTitle: 'text-white',
    lightTitle: 'text-slate-900',
    message: 'text-slate-400 text-center text-sm mb-8 leading-relaxed',
    buttonSecondary: 'flex-1 py-4 font-bold rounded-2xl transition-colors',
    darkSecondary: 'bg-slate-800 text-slate-300 hover:bg-slate-700',
    lightSecondary: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    buttonPrimary: 'flex-1 py-4 font-bold rounded-2xl text-white shadow-lg transition-all hover:-translate-y-1',
    gradientBg: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:via-orange-400 hover:to-amber-300',
  };

  // Determinar si es dark mode basándose en limitInfo o contexto
  const isDark = limitInfo?.isDarkMode !== false;

  return (
    <div className={themeClasses.overlay}>
      <div className={themeClasses.backdrop} onClick={onClose} />
      
      <div className={`${themeClasses.modal} ${isDark ? themeClasses.darkBg : themeClasses.lightBg}`}>
        {/* Icono de corona/estrella */}
        <div className={themeClasses.iconBg}>
          <span className="text-4xl">👑</span>
        </div>

        {/* Título */}
        <h2 className={`${themeClasses.title} ${isDark ? themeClasses.darkTitle : themeClasses.lightTitle}`}>
          ¡Límite del Plan Básico Alcanzado!
        </h2>

        {/* Mensaje */}
        <p className={themeClasses.message}>
          {limitInfo?.message || 'Has alcanzado el límite de tu plan actual. Actualiza a Premium para continuar usando todas las funciones.'}
        </p>

        {/* Información adicional si está disponible */}
        {limitInfo?.current && limitInfo?.limit && (
          <div className={`text-center mb-6 p-4 rounded-2xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Has usado <span className="font-bold text-amber-500">{limitInfo.current}</span> de <span className="font-bold">{limitInfo.limit}</span> disponibles
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className={`${themeClasses.buttonSecondary} ${isDark ? themeClasses.darkSecondary : themeClasses.lightSecondary}`}
          >
            Cerrar
          </button>
          <button 
            onClick={handleUpgrade}
            className={`${themeClasses.buttonPrimary} ${themeClasses.gradientBg}`}
          >
            ⚡ Mejorar a Premium
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;



