import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config.js';
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json' 
    },
    credentials: 'include', // ✅ Agrégalo siempre por consistencia
    body: JSON.stringify({ email }),
});

      const data = await response.json();

      if (response.ok) {
        setMessage('Si el correo existe, hemos enviado instrucciones para restablecer tu clave.');
      } else {
        setMessage(data.error || 'Hubo un error. Intenta más tarde.');
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
        
        <div className="bg-emerald-500/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>

        <h2 className="text-2xl font-black text-white mb-2">¿Problemas para entrar?</h2>
        <p className="text-sm text-slate-400 mb-8">Ingresa tu correo y te enviaremos un enlace para recuperar tu cuenta.</p>

        {message ? (
          <div className="bg-emerald-500/10 text-emerald-400 p-6 rounded-2xl text-sm font-bold mb-6 border border-emerald-500/20">
            {message}
            <button onClick={() => navigate('/login')} className="block w-full mt-4 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 rounded-xl text-emerald-400 transition-colors">
              Volver al inicio
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <input 
              type="email" 
              placeholder="tu@correo.com" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-[#0f172a] border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder:text-slate-600 transition-all"
            />
            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 relative overflow-hidden group rounded-2xl font-black shadow-lg transition-all duration-300 ${isLoading ? 'bg-slate-700 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-500/20 active:scale-[0.98]'}`}
            >
              {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;



