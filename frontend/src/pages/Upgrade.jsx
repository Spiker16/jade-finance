import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import API_URL from '../config.js';
initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY);

const Upgrade = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showBrick, setShowBrick] = useState(false);
  const [error, setError] = useState(null);
  const [preferenceId, setPreferenceId] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isPremium = user?.plan === 'premium';

  // CONFIGURACIÓN DE LOS PLANES PREMIUM
  const PREMIUM_PLANS = [
    { 
      id: 'monthly', 
      title: 'Mensual', 
      price: 15000, 
      tag: 'Básico',
      desc: 'Pago mes a mes' 
    },
    { 
      id: 'semester', 
      title: '6 Meses', 
      price: 75000, 
      tag: 'Ahorro 15%',
      popular: true 
    },
    { 
      id: 'annual', 
      title: 'Anual', 
      price: 130000, 
      tag: 'Mejor Valor',
    },
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

  const handleGetPreference = async (plan) => {
    setLoading(true);
    setError(null);
    setSelectedPlan(plan);
    
    try {
      const res = await fetch(`${API_URL}/api/payments/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          planType: plan.id,
          unitPrice: plan.price 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al conectar');

      const idDePago = data.preferenceId || data.id;
      if (idDePago) {
        setPreferenceId(idDePago);
        setShowBrick(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPayment = async (formData) => {
    try {
      const res = await fetch(`${API_URL}/api/payments/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.status === 'approved') {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        currentUser.plan = 'premium';
        localStorage.setItem('user', JSON.stringify(currentUser));
        window.dispatchEvent(new Event('storage'));
        navigate('/payment-result?status=success');
      } else {
        navigate(`/payment-result?status=${data.status || 'failure'}`);
      }
    } catch (err) {
      navigate('/payment-result?status=failure');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1121] px-4 py-12 text-white">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-black italic">
            {isPremium ? '⭐ ERES MIEMBRO PREMIUM' : '⚡ LLEVA TUS FINANZAS AL SIGUIENTE NIVEL'}
          </h1>
          <p className="text-slate-400 text-lg">
            {isPremium ? 'Gracias por confiar en Jade Finance.' : 'Elige el plan que mejor se adapte a tus metas.'}
          </p>
        </div>

        {/* COMPARACIÓN DE PLANES */}
        {!isPremium && !showBrick && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* CARD PLAN BÁSICO (SIEMPRE VISIBLE) */}
            <div className="p-8 rounded-[2rem] border border-slate-800 bg-slate-900/50 flex flex-col justify-between opacity-80">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-1">Actual</p>
                  <h2 className="text-2xl font-black">Plan Básico</h2>
                  <div className="text-3xl font-black mt-2 text-slate-400">$0</div>
                </div>
                <ul className="space-y-4">
                  {FEATURES_BASIC.map((f, i) => (
                    <li key={i} className={`flex items-center gap-3 text-sm ${f.ok ? 'text-slate-300' : 'text-slate-600 line-through'}`}>
                      <span className={f.ok ? 'text-emerald-500' : 'text-slate-700'}>{f.ok ? '✓' : '✕'}</span>
                      {f.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-800 text-center text-xs font-bold text-slate-500">
                PLAN ACTIVO
              </div>
            </div>

            {/* CARDS PLANES PREMIUM */}
            {PREMIUM_PLANS.map((plan) => (
              <div key={plan.id} className={`p-8 rounded-[2rem] border flex flex-col justify-between relative transition-all ${plan.popular ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20 shadow-2xl shadow-emerald-500/10' : 'border-slate-700 bg-slate-800/40'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-black text-[10px] font-black rounded-full uppercase">
                    Recomendado
                  </div>
                )}
                <div className="space-y-6">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-tighter mb-1 ${plan.popular ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {plan.tag}
                    </p>
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
                  className={`mt-8 w-full py-4 rounded-2xl font-black text-sm uppercase transition-all hover:-translate-y-1 ${plan.popular ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20' : 'border border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10'}`}
                >
                  {loading ? 'Procesando...' : 'Obtener Premium'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* BRICK DE PAGO */}
        {showBrick && preferenceId && (
          <div className="max-w-xl mx-auto p-8 rounded-[3rem] border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="text-center mb-8">
              <h3 className="text-xl font-black uppercase italic">Suscripción {selectedPlan?.title}</h3>
              <p className="text-emerald-400 text-2xl font-black mt-1">${selectedPlan?.price.toLocaleString()} COP</p>
            </div>
            <Payment
              initialization={{ amount: selectedPlan?.price, preferenceId: preferenceId }}
              customization={{
                visual: { theme: 'dark', customVariables: { baseColor: '#10b981' } },
                paymentMethods: { 
                  ticket: "none",
                  bankTransfer: "none",
                  creditCard: "all", 
                  debitCard: "all", 
                  mercadoPago: "all",
                  atm: "none"
                }
              }}
              onSubmit={onSubmitPayment}
              onError={() => { setShowBrick(false); setError('Error al cargar Mercado Pago'); }}
            />
            <button onClick={() => setShowBrick(false)} className="w-full mt-6 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest">
              ← Cambiar plan
            </button>
          </div>
        )}

        {/* FOOTER SEGURIDAD */}
        <div className="flex justify-center gap-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest pt-10">
          <span>🔒 Encriptación SSL</span>
          <span>🛡️ Mercado Pago Secure</span>
          <span>⚡ Activación Instantánea</span>
        </div>

      </div>
    </div>
  );
};

export default Upgrade;



