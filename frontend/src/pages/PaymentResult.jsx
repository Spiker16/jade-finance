import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API_URL from '../config.js';
const PaymentResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const status = searchParams.get('status');

  const RESULTS = {
    success: {
      icon: '🎉',
      title: '¡Pago exitoso!',
      message: 'Tu plan Premium está activo. Ahora tienes acceso ilimitado a todas las funciones de Jade Finance.',
      color: 'emerald',
      borderColor: 'border-emerald-500/40',
      bgColor: 'bg-emerald-500/10',
      titleColor: 'text-emerald-400',
      btnColor: 'bg-emerald-500 hover:bg-emerald-400',
      redirect: '/dashboard'
    },
    pending: {
      icon: '⏳',
      title: 'Pago en revisión',
      message: 'Tu pago está siendo procesado. Te notificaremos cuando se confirme y tu plan se actualizará automáticamente.',
      color: 'amber',
      borderColor: 'border-amber-500/40',
      bgColor: 'bg-amber-500/10',
      titleColor: 'text-amber-400',
      btnColor: 'bg-amber-500 hover:bg-amber-400',
      redirect: '/dashboard'
    },
    failure: {
      icon: '❌',
      title: 'Pago fallido',
      message: 'No pudimos procesar tu pago. Verifica los datos de tu tarjeta e intenta de nuevo.',
      color: 'red',
      borderColor: 'border-red-500/40',
      bgColor: 'bg-red-500/10',
      titleColor: 'text-red-400',
      btnColor: 'bg-red-500 hover:bg-red-400',
      redirect: '/upgrade'
    }
  };

  const result = RESULTS[status] || RESULTS.failure;

  useEffect(() => {
    if (status === 'success') {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      currentUser.plan = 'premium';
      localStorage.setItem('user', JSON.stringify(currentUser));
      window.dispatchEvent(new Event('storage'));
    }
  }, [status]);

  // ✅ CORRECCIÓN: countdown separado de la navegación
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ✅ CORRECCIÓN: navigate en su propio useEffect, reacciona cuando countdown llega a 0
  useEffect(() => {
    if (countdown === 0) {
      navigate(result.redirect);
    }
  }, [countdown, navigate, result.redirect]);

  return (
    <div className="min-h-screen bg-[#0B1121] flex items-center justify-center px-4">
      <div className={`w-full max-w-md p-10 rounded-[2.5rem] border ${result.borderColor} ${result.bgColor} text-center space-y-6`}>

        <div className="text-7xl animate-bounce">{result.icon}</div>

        <div className="space-y-2">
          <h1 className={`text-3xl font-black ${result.titleColor}`}>{result.title}</h1>
          <p className="text-slate-400 text-sm leading-relaxed">{result.message}</p>
        </div>

        {status === 'success' && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-500">Plan Activado</p>
            <p className="text-white font-bold">⭐ Jade Finance Premium</p>
            <p className="text-xs text-slate-400">Acceso ilimitado a todas las funciones</p>
          </div>
        )}

        {status === 'pending' && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-amber-500">Estado</p>
            <p className="text-white font-bold">⏳ Procesando pago</p>
            <p className="text-xs text-slate-400">Puede tomar hasta 24 horas hábiles</p>
          </div>
        )}

        {status === 'failure' && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2 text-left">
            <p className="text-xs font-black uppercase tracking-widest text-red-400">Posibles causas</p>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Fondos insuficientes</li>
              <li>• Datos de tarjeta incorrectos</li>
              <li>• Tarjeta no habilitada para pagos online</li>
              <li>• Límite de la tarjeta excedido</li>
            </ul>
          </div>
        )}

        <p className="text-xs text-slate-500">
          Redirigiendo en <span className="font-black text-slate-300">{countdown}</span> segundos...
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(result.redirect)}
            className={`w-full py-4 ${result.btnColor} text-white font-black rounded-2xl transition-all shadow-lg hover:-translate-y-1`}
          >
            {status === 'failure' ? '🔄 Intentar de nuevo' : '🏠 Ir al Dashboard'}
          </button>

          {status !== 'failure' && (
            <button
              onClick={() => navigate('/upgrade')}
              className="w-full py-3 text-slate-400 hover:text-white text-sm font-bold transition-colors"
            >
              Ver detalles del plan
            </button>
          )}
        </div>

        <p className="text-xs text-slate-600">
          ¿Problemas con tu pago?{' '}
          <a href="mailto:jade.support1@gmail.com" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
            Contáctanos
          </a>
        </p>
      </div>
    </div>
  );
};

export default PaymentResult;



