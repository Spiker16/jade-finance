import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import API_URL from '../config.js';

const EMOJIS = ['💰','💸','💵','💳','🏦','📈','📉','💎','⚖️','💼','🍔','🍕','🚗','🏠','🎬','🛒','🎁','📱','🎮','💊','🏥','🎓','👗','👟','🐶','⚽','✈️','💡','🔧','🔥','🌈','🍣'];
const CURRENCIES = [
  { code: 'COP', symbol: '$' }, { code: 'USD', symbol: '$' }, 
  { code: 'EUR', symbol: '€' }, { code: 'MXN', symbol: '$' }
];

const Settings = () => {
  // Obtenemos el contexto del layout (donde suele estar darkMode y la función para actualizar el usuario)
  const context = useOutletContext();
  const darkMode = context?.darkMode ?? true;
  
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [status, setStatus] = useState({ msg: '', type: '' });
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [email, setEmail] = useState(user.email || '');
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [currency, setCurrency] = useState(user.currency || 'COP');
  const [notifications, setNotifications] = useState(user.notifications || { alerts: true, reports: false });
  const [categories, setCategories] = useState([]);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [catToDelete, setCatToDelete] = useState(null);
  const [newCat, setNewCat] = useState({ name: '', emoji: '💰', type: 'gasto' });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/api/user/categories`, { 
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
          const currentUser = JSON.parse(localStorage.getItem('user')) || {};
          localStorage.setItem('user', JSON.stringify({ ...currentUser, categories: data }));
        }
      } catch (err) {
        console.error("Error en fetch:", err);
      }
    };
    fetchCategories();
  }, []);

  const showFeedback = (msg, type = 'success') => {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: '', type: '' }), 4000);
  };

  const handleAddCategory = async () => {
    if (!newCat.name) return showFeedback("Escribe un nombre", "error");

    // Verificación de plan (asumiendo que isPremium es un booleano en tu objeto user)
    const isPremium = user.isPremium || user.plan === 'premium';
    if (!isPremium && categories.length >= 5) {
      showFeedback("Límite de 5 categorías alcanzado. ¡Pásate a Premium!", "error");
      return;
    }

    try {
      // CORREGIDO: Las comillas del fetch estaban mal
      const res = await fetch(`${API_URL}/api/user/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newCat)
      });

      if (res.ok) {
        const updatedCats = await res.json();
        setCategories(updatedCats);
        const newUser = { ...user, categories: updatedCats };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        setNewCat({ name: '', emoji: '💰', type: 'gasto' });
        showFeedback("Categoría añadida correctamente");
      } else {
        const errorData = await res.json();
        showFeedback(errorData.error || "Error al guardar", "error");
      }
    } catch (error) {
      showFeedback("Error de conexión", "error");
    }
  };

  const confirmDeleteCategory = async () => {
    if (!catToDelete) return;
    try {
      const res = await fetch(`${API_URL}/api/user/categories/${catToDelete}`, {
        method: "DELETE",
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        const updatedCats = await res.json();
        setCategories(updatedCats);
        const newUser = { ...user, categories: updatedCats };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        showFeedback("Categoría eliminada", "success");
      }
    } catch (error) {
      showFeedback("Error al borrar", "error");
    } finally {
      setShowCatModal(false);
      setCatToDelete(null);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) { // Límite 2MB para evitar errores de base de datos
        return showFeedback("La imagen es muy pesada (máx 2MB)", "error");
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch(`${API_URL}/api/user/update-profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ profilePic: reader.result })
        });
        
        if (res.ok) {
          const updated = { ...user, profilePic: reader.result };
          setUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
          // Emitimos evento para que el Navbar se entere del cambio de foto
          window.dispatchEvent(new Event('storage')); 
          showFeedback("Foto de perfil actualizada");
        }
      } catch (error) {
        showFeedback("Error al subir la imagen", "error");
      }
    };
    reader.readAsDataURL(file);
  };

  const saveGeneralSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/update-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, currency, notifications })
      });
      if (res.ok) {
        const updated = { ...user, email, currency, notifications };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        showFeedback("Configuración guardada");
      }
    } catch (error) {
      showFeedback("Error de conexión", "error");
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return showFeedback("Las contraseñas no coinciden", "error");
    if (passwords.new.length < 6) return showFeedback("Mínimo 6 caracteres", "error");

    try {
      const res = await fetch(`${API_URL}/api/user/update-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new })
      });
      if (res.ok) {
        setPasswords({ current: '', new: '', confirm: '' });
        showFeedback("Contraseña actualizada con éxito");
      } else {
        showFeedback("La contraseña actual es incorrecta", "error");
      }
    } catch (error) {
      showFeedback("Error de conexión", "error");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/me`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        localStorage.clear();
        window.location.href = '/login';
      } else {
        showFeedback("Error al eliminar cuenta", "error");
      }
    } catch (error) {
      showFeedback("Error de conexión", "error");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const theme = {
    card: darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xl',
    input: darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 px-4 animate-fade-in">
      {/* NOTIFICACIÓN FLOTANTE */}
      {status.msg && (
        <div className={`fixed bottom-10 right-10 z-[100] px-8 py-5 rounded-[2rem] shadow-2xl font-black text-white animate-pop ${status.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
          {status.msg}
        </div>
      )}

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className={`text-5xl md:text-6xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-800'}`}>Ajustes</h1>
          <p className="text-slate-500 font-bold ml-1">Configuración general y suscripción</p>
        </div>
        <div className={`px-4 py-2 rounded-2xl font-black text-[10px] uppercase border ${user.plan === 'premium' ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
          Plan {user.plan?.toUpperCase() || 'BASIC'}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: PERFIL Y PLAN */}
        <div className="lg:col-span-4 space-y-6">
          <div className={`p-10 rounded-[3.5rem] border text-center relative group ${theme.card}`}>
            <div className="relative w-36 h-36 mx-auto mb-6 cursor-pointer" onClick={() => fileInputRef.current.click()}>
              {user.profilePic ? (
                <img src={user.profilePic} alt="Profile" className="w-full h-full rounded-[2.5rem] object-cover border-4 border-emerald-500 shadow-2xl" />
              ) : (
                <div className="w-full h-full rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-6xl text-white font-black">{user.name?.charAt(0)}</div>
              )}
              <div className="absolute inset-0 bg-black/60 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-[10px] font-black uppercase">Cambiar Foto</div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoChange} />
            </div>
            <h3 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>{user.name}</h3>
            <p className={`text-xs font-bold mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{user.email}</p>
          </div>

          {/* PLANES */}
          <div className={`p-8 rounded-[3rem] border ${theme.card}`}>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Tu Membresía</h4>
            <div className="space-y-4">
              <div className={`w-full p-4 rounded-2xl border-2 flex justify-between items-center ${user.plan !== 'premium' ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 opacity-50'}`}>
                <div className="text-left">
                  <div className={`font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Plan Básico</div>
                  <div className="text-[10px] text-slate-500 italic">Límite de 5 categorías</div>
                </div>
                {user.plan !== 'premium' && <div className="bg-emerald-500 w-2 h-2 rounded-full shadow-[0_0_10px_#10b981]"></div>}
              </div>

              <div className={`w-full p-4 rounded-2xl border-2 flex justify-between items-center ${user.plan === 'premium' ? 'border-amber-500 bg-amber-500/5' : 'border-slate-800'}`}>
                <div className="text-left">
                  <div className="font-black text-amber-500 text-xs">Premium ✨</div>
                  <div className="text-[10px] text-slate-500 italic">Categorías ilimitadas</div>
                </div>
                {user.plan === 'premium' && <div className="bg-amber-500 w-2 h-2 rounded-full shadow-[0_0_10px_#f59e0b]"></div>}
              </div>
            </div>
          </div>

          {/* PREFERENCIAS */}
          <div className={`p-8 rounded-[3rem] border ${theme.card}`}>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Preferencias</h4>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 mb-2 block uppercase">Moneda</label>
                <div className="grid grid-cols-2 gap-2">
                  {CURRENCIES.map(c => (
                    <button key={c.code} onClick={() => setCurrency(c.code)} className={`p-3 rounded-xl border text-xs font-bold transition-all ${currency === c.code ? 'bg-emerald-500 text-white border-emerald-500' : theme.input}`}>
                      {c.code}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-500/5 border border-slate-500/10 cursor-pointer">
                  <span className={`text font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Alertas de Gasto</span>
                  <input type="checkbox" checked={notifications.alerts} onChange={() => setNotifications({...notifications, alerts: !notifications.alerts})} className="w-5 h-5 accent-emerald-500" />
                </label>
              </div>
              <button onClick={saveGeneralSettings} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-lg shadow-indigo-500/20">GUARDAR CAMBIOS</button>
            </div>
          </div>
          
          <button 
            onClick={() => setShowDeleteModal(true)} 
            className="w-full py-4 bg-rose-500/10 text-rose-500 rounded-3xl font-black text-[10px] hover:bg-rose-500 hover:text-white transition-all">
            ELIMINAR MI CUENTA
          </button>
        </div>

        {/* COLUMNA DERECHA: SEGURIDAD Y CATEGORÍAS */}
        <div className="lg:col-span-8 space-y-6">
          <section className={`p-10 rounded-[3.5rem] border ${theme.card}`}>
            <h3 className={`text-2xl font-black mb-6 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Seguridad</h3>
            <div className="space-y-8">
              <div className="space-y-3 pb-6 border-b border-slate-800/50">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Email de acceso</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className={`flex-1 p-5 rounded-3xl font-bold border outline-none ${theme.input}`} />
                  <button onClick={saveGeneralSettings} className="px-10 py-4 bg-indigo-600 text-white rounded-3xl font-black text-xs hover:bg-indigo-500 transition-all">ACTUALIZAR</button>
                </div>
              </div>
              <form onSubmit={updatePassword} className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Cambiar Contraseña</label>
                <input type="password" placeholder="Contraseña Actual" value={passwords.current} onChange={(e)=>setPasswords({...passwords, current:e.target.value})} className={`w-full p-5 rounded-3xl border outline-none ${theme.input}`} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input type="password" placeholder="Nueva Contraseña" value={passwords.new} onChange={(e)=>setPasswords({...passwords, new:e.target.value})} className={`w-full p-5 rounded-3xl border outline-none ${theme.input}`} />
                  <input type="password" placeholder="Confirmar Nueva" value={passwords.confirm} onChange={(e)=>setPasswords({...passwords, confirm:e.target.value})} className={`w-full p-5 rounded-3xl border outline-none ${theme.input}`} />
                </div>
                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl hover:bg-indigo-500 transition-all">ACTUALIZAR CLAVE</button>
              </form>
            </div>
          </section>

          {/* CATEGORÍAS PERSONALIZADAS */}
          <section className={`p-10 rounded-[3.5rem] border ${theme.card}`}>
            <div className="flex justify-between items-center mb-8">
              <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Mis Categorías</h3>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full ${user.plan === 'premium' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                {categories.length} {user.plan === 'premium' ? 'Categorías' : '/ 5 disponibles'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
              {categories.map((cat) => (
                <div key={cat._id} className="p-4 rounded-3xl border border-slate-800 bg-slate-800/40 text-center relative group overflow-hidden transition-all hover:border-indigo-500/50">
                  <button onClick={() => { setCatToDelete(cat._id); setShowCatModal(true); }} className="absolute top-2 right-2 bg-rose-500 text-white w-6 h-6 rounded-full text-[10px] font-black opacity-0 group-hover:opacity-100 transition-all z-10">✕</button>
                  <div className="text-3xl mb-1">{cat.emoji}</div>
                  <div className="font-black text-[10px] uppercase text-white truncate">{cat.name}</div>
                  <div className={`text-[7px] font-bold uppercase mt-1 ${cat.type === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'}`}>{cat.type}</div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-emerald-500/5 rounded-[2.5rem] border border-dashed border-emerald-500/20 flex flex-col md:flex-row gap-3">
              <select value={newCat.emoji} onChange={e => setNewCat({...newCat, emoji: e.target.value})} className={`p-4 rounded-2xl text-2xl border outline-none cursor-pointer ${theme.input}`}>
                {EMOJIS.map((e, i) => <option key={i} value={e}>{e}</option>)}
              </select>
              <input type="text" placeholder="Nombre (ej. Gimnasio)" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} className={`flex-1 p-4 rounded-2xl font-bold border outline-none ${theme.input}`} />
              <select value={newCat.type} onChange={e => setNewCat({...newCat, type: e.target.value})} className={`p-4 rounded-2xl font-bold text-xs border outline-none cursor-pointer ${theme.input}`}>
                <option value="gasto">ES GASTO 📉</option>
                <option value="ingreso">ES INGRESO 📈</option>
              </select>
              <button onClick={handleAddCategory} className="bg-emerald-500 text-white px-8 rounded-2xl font-black h-14 md:h-auto hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                AÑADIR
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* MODALES DE CONFIRMACIÓN */}
      <ConfirmModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleDeleteAccount} 
        title="¿Eliminar cuenta?" 
        message="Esta acción borrará todos tus datos financieros de forma permanente. No se puede deshacer." 
        confirmText="Sí, borrar todo" 
        cancelText="No, cancelar" 
      />

      <ConfirmModal 
        isOpen={showCatModal} 
        onClose={() => setShowCatModal(false)} 
        onConfirm={confirmDeleteCategory} 
        title="¿Eliminar categoría?" 
        message="Esta categoría se quitará de tu lista. Los registros que ya tengan esta categoría no se verán afectados." 
        confirmText="Sí, eliminar" 
        cancelText="No, mantener" 
      />
    </div>
  );
};

export default Settings;