import React from 'react';


const ConfirmModal = ({ 
  isOpen, 
  onClose,           // Esta es la función que pasas desde Settings
  title, 
  message, 
  onConfirm, 
  confirmText = "Eliminar", 
  cancelText = "Cancelar", // Agregado para usar el texto personalizado
  isDanger = true 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-sm border border-slate-700 overflow-hidden transform transition-all">
        
        {/* Encabezado con ícono de advertencia */}
        <div className={`p-6 flex flex-col items-center text-center ${isDanger ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDanger ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isDanger ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
          <p className="text-sm text-slate-400">{message}</p>
        </div>

        {/* Botones de acción */}
        <div className="p-6 flex gap-3 bg-[#0f172a]">
          <button 
            onClick={onClose} // CORREGIDO: Ahora usa onClose para cerrar el modal
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors"
          >
            {cancelText}    {/* CORREGIDO: Ahora muestra "No, mantener cuenta" */}
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-colors shadow-lg ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20' 
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;



