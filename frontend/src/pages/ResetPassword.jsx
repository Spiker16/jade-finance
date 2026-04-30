import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_URL from '../config.js';
const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (password !== confirmPassword) {
      return setMessage('Las contraseñas no coinciden');
    }

    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:3000/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsSuccess(true);
        // Redirigir automáticamente al login después de 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
      <div className="max-w-md w-full bg-[#1e293b] rounded-[2.5rem] shadow-2xl p-8 border border-emerald-500/10 text-center">
        
        {/* Icono superior Premium */}
        <div className="bg-emerald-500/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h2 className="text-2xl font-black text-white mb-6">Nueva Contraseña</h2>

        {isSuccess ? (
          // PANTALLA DE ÉXITO 
          <div className="animate-fade-in">
            <div className="bg-emerald-500/10 text-emerald-400 p-6 rounded-2xl text-sm font-bold mb-6 border border-emerald-500/20">
              ¡Tu contraseña ha sido actualizada con éxito!
            </div>
            <p className="text-slate-400 text-sm mb-6">Serás redirigido al inicio de sesión en unos segundos...</p>
            <button 
              onClick={() => navigate('/login')} 
              className="block w-full py-3 bg-emerald-600/20 hover:bg-emerald-600/30 rounded-xl text-emerald-400 transition-colors font-bold"
            >
              Ir al Login ahora
            </button>
          </div>
        ) : (
          // FORMULARIO DE CAMBIO DE CLAVE
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div>
              <label className="block text-slate-400 text-sm font-bold mb-2 pl-2">Nueva Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl p-4 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-slate-400 text-sm font-bold mb-2 pl-2">Confirmar Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl p-4 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {message && <p className="text-red-400 text-sm font-bold text-center mt-2">{message}</p>}
            
            {/* Botón Premium */}
            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full mt-6 py-4 relative overflow-hidden group rounded-2xl font-black shadow-lg transition-all duration-300
                ${isLoading 
                  ? 'bg-slate-700 cursor-not-allowed opacity-70' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-500/20 active:scale-[0.98]'}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-white">Actualizando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-white">
                  <span>Actualizar Contraseña</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;



