import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

// URL de tu API
const API_URL = import.meta.env.VITE_API_URL || 'https://jade-finance-api.onrender.com';

// Inicialización de Mercado Pago
initMercadoPago('APP_USR-a6e56be2-6815-49e7-9d06-287fc31a4ac0', {
  locale: 'es-CO'
});

const Upgrade = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showBrick, setShowBrick] = useState(false);
  const [error, setError] = useState(null);
  const [preferenceId, setPreferenceId] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Obtener datos del usuario de localstorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isPremium = user?.plan === 'premium';

  // --- CONFIGURACIÓN DE PLANES ---
  const PREMIUM_PLANS = [
    { id: 'monthly', title: 'Mensual', price: 15000, tag: 'Básico', desc: 'Pago mes a mes' },
    { id: 'semester', title: '6 Meses', price: 75000, tag: 'Ahorro 15%', popular: true },
    { id: 'annual', title: 'Anual', price: 130000, tag: 'Mejor Valor' },
  ];

  const FEATURES_BASIC = [
    { text: '50 transacciones al mes', ok: true },
    { text: '2 presupuestos', ok: true },
    { text: '2 metas', ok: true },
    { text: '2 deudas/ metas', ok: true },
    { text: 'Transacciones ilimitadas', ok: false },
    { text: 'Soporte prioritario', ok: false },
  ];

  const FEATURES_PREMIUM = [
    { text: 'Transacciones ilimitadas', ok: true },
    { text: 'Presupuestos ilimitados', ok: true },
    { text: 'Categorías personalizadas / ilimitadas', ok: true },
    { text: 'Reportes avanzados', ok: true },
    { text: 'Metas ilimitadas', ok: true },
    { text: 'Soporte prioritario', ok: true },
  ];

  // 1. Obtener la preferencia del Backend
  const handleGetPreference = async (plan) => {
    setError(null);
    const token = localStorage.getItem('token'); // VERIFICA QUE ESTA KEY SEA LA CORRECTA

    if (!token) {
      setError("Sesión expirada o no encontrada. Por favor, inicia sesión.");
      return;
    }

    setLoading(true);
    setSelectedPlan(plan);
    
    try {
      console.log("Enviando petición a:", `${API_URL}/api/payments/create-preference`);
      
      const res = await fetch(`${API_URL}/api/payments/create-preference`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Formato estándar
        },
        body: JSON.stringify({ 
          planType: plan.id,
          unitPrice: plan.price 
        })
      });

      if (res.status === 401) {
        throw new Error("No autorizado. Tu sesión podría haber expirado.");
      }

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Error al generar la preferencia');

      if (data.preferenceId) {
        setPreferenceId(data.preferenceId);
        setShowBrick(true);
      }
    } catch (err) {
      setError(err.message);
      console.error("❌ Error en handleGetPreference:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Procesar el pago final (Brick)
  const onSubmitPayment = async (formData) => {
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${API_URL}/api/payments/process`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ formData })
      });
      
      const data = await res.json();
      
      if (data.status === 'approved') {
        // Actualizar estado local para reflejar que ya es Premium inmediatamente
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        currentUser.plan = 'premium';
        localStorage.setItem('user', JSON.stringify(currentUser));
        window.dispatchEvent(new Event('storage')); // Notificar a otros componentes
        
        navigate('/payment-result?status=success');
      } else {
        navigate(`/payment-result?status=${data.status || 'failure'}`);
      }
    } catch (err) {
      console.error("❌ Error en onSubmitPayment:", err);
      navigate('/payment-result?status=failure');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1121] px-4 py-12 text-white font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-black italic tracking-tighter">
            {isPremium ? '⭐ MEMBRESÍA PREMIUM ACTIVA' : '⚡ ESCALA TUS FINANZAS'}
          </h1>
          <p className="text-slate-400 text-lg">
            {isPremium ? 'Disfrutas de acceso total a Jade Finance.' : 'Desbloquea herramientas avanzadas y metas ilimitadas.'}
          </p>
        </div>

        {/* COMPARACIÓN DE PLANES (Solo se muestra si no hay Brick activo y no es premium) */}
        {!isPremium && !showBrick && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CARD PLAN BÁSICO (INFO) */}
            <div className="p-8 rounded-[2rem] border border-slate-800 bg-slate-900/30 flex flex-col justify-between opacity-70">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tu plan actual</p>
                  <h2 className="text-2xl font-black">Free</h2>
                  <div className="text-3xl font-black mt-2 text-slate-400">$0</div>
                </div>
                <ul className="space-y-4">
                  {FEATURES_BASIC.map((f, i) => (
                    <li key={i} className={`flex items-center gap-3 text-sm ${f.ok ? 'text-slate-400' : 'text-slate-600 line-through'}`}>
                      <span className={f.ok ? 'text-emerald-500' : 'text-slate-700'}>{f.ok ? '✓' : '✕'}</span>
                      {f.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-800 text-center text-xs font-bold text-slate-600 uppercase">Activo</div>
            </div>

            {/* MAPEO DE PLANES PREMIUM */}
            {PREMIUM_PLANS.map((plan) => (
              <div key={plan.id} className={`p-8 rounded-[2rem] border flex flex-col justify-between relative transition-all duration-300 ${plan.popular ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20 shadow-2xl shadow-emerald-500/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-500'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-black text-[10px] font-black rounded-full uppercase shadow-lg">Más Popular</div>
                )}
                <div className="space-y-6">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${plan.popular ? 'text-emerald-400' : 'text-slate-400'}`}>{plan.tag}</p>
                    <h2 className="text-2xl font-black">Premium {plan.title}</h2>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-black">${plan.price.toLocaleString()}</span>
                      <span className="text-slate-500 text-xs font-bold">COP</span>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {FEATURES_PREMIUM.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-slate-200">
                        <span className="text-emerald-500 font-bold">✓</span>
                        {f.text}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => handleGetPreference(plan)}
                  disabled={loading}
                  className={`mt-8 w-full py-4 rounded-2xl font-black text-sm uppercase transition-all transform active:scale-95 ${plan.popular ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-xl' : 'border border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-black'}`}
                >
                  {loading && selectedPlan?.id === plan.id ? 'Generando...' : 'Elegir Plan'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* MANEJO DE ERRORES VISIBLE */}
        {error && (
          <div className="max-w-xl mx-auto p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center animate-pulse">
            <p className="text-rose-400 text-sm font-bold">⚠️ {error}</p>
            <p className="text-rose-400/60 text-[10px] mt-1">Verifica tu conexión y sesión de usuario</p>
          </div>
        )}

        {/* MODAL DEL BRICK DE PAGO */}
        {showBrick && preferenceId && (
          <div className="max-w-xl mx-auto p-8 rounded-[3rem] border border-slate-700 bg-slate-900 shadow-2xl relative overflow-hidden">
             {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -z-10"></div>
            
            <div className="mb-8 text-center">
              <h3 className="text-xl font-black uppercase tracking-tighter">Finalizar Pago</h3>
              <p className="text-slate-400 text-sm">Estas adquiriendo el plan <span className="text-emerald-400 font-bold">{selectedPlan?.title}</span></p>
              <div className="mt-2 text-2xl font-black text-white">${selectedPlan?.price.toLocaleString()} COP</div>
            </div>

            <Payment
              key={preferenceId} 
              initialization={{ 
                amount: selectedPlan?.price, 
                preferenceId: preferenceId 
              }}
              customization={{
                visual: { 
                  theme: 'dark', 
                  customVariables: { 
                    baseColor: '#10b981',
                    borderRadiusLarge: '24px'
                  } 
                },
                paymentMethods: {
                  maxInstallments: 1,
                  bankTransfer: 'all',
                  creditCard: 'all',
                  debitCard: 'all'
                }
              }}
              onSubmit={onSubmitPayment}
              onReady={() => setLoading(false)}
              onError={(err) => { 
                console.error('Error Brick MercadoPago:', err);
                setError('No se pudo cargar el formulario. Intenta con otro navegador o limpia el caché.');
                setShowBrick(false); 
              }}
            />

            <button 
              onClick={() => { setShowBrick(false); setPreferenceId(null); }} 
              className="w-full mt-8 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
            >
              ← Cancelar y elegir otro plan
            </button>
          </div>
        )}

        {/* SELLOS DE SEGURIDAD */}
        <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest pt-12">
          <span className="flex items-center gap-2">🛡️ Pago Protegido por Mercado Pago</span>
          <span className="flex items-center gap-2">🔐 Conexión Segura SSL</span>
          <span className="flex items-center gap-2">🚀 Activación Premium en segundos</span>
        </div>

      </div>
    </div>
  );
};

export default Upgrade;