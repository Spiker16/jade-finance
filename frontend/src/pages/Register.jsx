// frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config.js';
const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); 
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 🟢 ¡AQUÍ ESTÁ LA LÍNEA AÑADIDA! Guarda la cookie de sesión.
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al registrar usuario');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirigimos al usuario al Dashboard
      navigate('/dashboard');

    } catch (err) {
      console.error("Error de conexión:", err);
      setError('Error al conectar con el servidor. ¿Está encendido?');
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
        
        {/* LOGO Y BRANDING JADE FINANCE */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/30 rotate-3 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight text-center">
            Únete a <span className="text-emerald-500">JADE</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            Toma el control de tu futuro financiero hoy mismo.
          </p>
        </div>

        {/* MENSAJE DE ERROR */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold text-center">
            {error}
          </div>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-400 ml-1 block mb-1">NOMBRE COMPLETO</label>
            <input 
              type="text" 
              placeholder="Ej. Pepito Pérez" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-400 ml-1 block mb-1">CORREO ELECTRÓNICO</label>
            <input 
              type="email" 
              placeholder="correo@ejemplo.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-400 ml-1 block mb-1">CONTRASEÑA</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-lg shadow-emerald-500/30 ${
              isLoading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
            }`}
          >
            {isLoading ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        {/* ENLACE A LOGIN */}
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
          ¿Ya eres parte de Jade?{' '}
          <button 
            onClick={() => navigate('/login')} 
            className="text-emerald-600 dark:text-emerald-400 font-black hover:underline transition-all"
          >
            Inicia Sesión
          </button>
        </p>

      </div>
      
      {/* Sello de Autoría (Opcional) */}
      <div className="absolute bottom-6 text-[10px] text-gray-400 font-medium">
        Desarrolado por <span className="text-emerald-500 font-bold">Juan David Espinosa Pascuas</span>
      </div>
    </div>
  );
};

export default Register;



