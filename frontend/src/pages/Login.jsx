// frontend/src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config.js';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // NUEVO: Estado para el checkbox
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // EFECTO: Al cargar el componente, verificar si hay un correo recordado
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedJadeEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Credenciales incorrectas');
        setIsLoading(false);
        return;
      }

      // --- LÓGICA DE RECORDAR ---
      if (rememberMe) {
        localStorage.setItem('rememberedJadeEmail', email);
      } else {
        localStorage.removeItem('rememberedJadeEmail');
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/dashboard';

    } catch (err) {
      console.error("Error de conexión:", err);
      setError('Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
        
        {/* LOGO JADE FINANCE */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/30 -rotate-3 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-8 w-8">
            <rect width="64" height="64" rx="14" fill="#1a7a5e"/>
            <rect x="26" y="10" width="7" height="33" rx="3" fill="white"/>
            <path d="M26 42 Q26 56 18 57 Q12 58 10 53"
                  fill="none" stroke="white" strokeWidth="7" strokeLinecap="round"/>
            <polyline points="33,50 41,40 49,45 57,30"
                      fill="none" stroke="#7de8c0"
                      strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="33" cy="50" r="2.5" fill="#7de8c0"/>
            <circle cx="41" cy="40" r="2.5" fill="#7de8c0"/>
            <circle cx="49" cy="45" r="2.5" fill="#7de8c0"/>
            <circle cx="57" cy="30" r="2.5" fill="#7de8c0"/>
          </svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight text-center">
            Bienvenido a <span className="text-emerald-500">JADE</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            Gestiona tus finanzas con la seguridad de Jade.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-400 ml-1 block mb-1 uppercase tracking-wider">Email</label>
            <input 
              type="email" 
              placeholder="tu@correo.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-400 ml-1 block mb-1 uppercase tracking-wider">Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* OPCIÓN RECORDAR (CHECKBOX) */}
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center group cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only" 
                />
                <div className={`w-5 h-5 border-2 rounded-md transition-all ${rememberMe ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600'}`}>
                  {rememberMe && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white mx-auto" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="ml-2 text-xs font-bold text-gray-500 dark:text-gray-400 select-none">Recordarme</span>
            </label>
            
            <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs font-bold text-emerald-600 hover:underline">
              ¿Olvidaste tu clave?
            </button>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-lg shadow-emerald-500/30 ${
              isLoading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
            }`}
          >
            {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
          ¿Aún no tienes cuenta?{' '}
          <button 
            onClick={() => navigate('/register')} 
            className="text-emerald-600 dark:text-emerald-400 font-black hover:underline transition-all"
          >
            Regístrate gratis
          </button>
        </p>

      </div>

      <div className="absolute bottom-6 text-[10px] text-gray-400 font-medium">
        Jade Finance | Desarrollado por <span className="text-emerald-500 font-bold">Juan David Espinosa Pascuas</span>
      </div>
    </div>
  );
};

export default Login;



