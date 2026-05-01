import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import API_URL from '../config.js';

const socket = io(API_URL, {
  autoConnect: false,
  reconnection: true,
  withCredentials: true
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const NotificationBell = ({ userId, darkMode }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const lastProcessedMessage = useRef(null);
  
  // ✨ REF PARA EVITAR SUBSCRIPCIONES DUPLICADAS
  const hasSubscribed = useRef(false);

  const subscribeToPush = useCallback(async () => {
    // Si ya nos suscribimos en esta sesión, no lo hacemos de nuevo
    if (hasSubscribed.current) return;
    
    try {
      const register = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array('BHJdCOlwJvcHAOiE6yyUvVVMO49VNV_R79X5glefzQkJFcUmlhu-iUHvlV8IkxP-q_opdeOy5fj07koyr4sVifI')
      });

      await fetch(`${API_URL}/api/notifications/subscribe`, {
        method: 'POST',
        body: JSON.stringify({ subscription, userId }),
        headers: { 
          'Content-Type': 'application/json',
         },
          credentials: 'include' // ✅ Agregamos esto
        });
      
      hasSubscribed.current = true; // Marcamos como suscrito con éxito
    } catch (error) {
      console.error("Error suscribiendo al Web Push:", error);
    }
  }, [userId]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
       headers: { 
      },
      credentials: 'include'
    })
      if (res.ok) {
        const data = await res.json();
        const unicas = data.filter((n, index, self) => 
          index === self.findIndex((t) => t.message === n.message)
        );
        setNotifications(unicas);
      }
    } catch (error) {
      console.error("Error cargando notificaciones", error);
    }
  }, [userId]);

  // ✨ EFECTO CORREGIDO: Solo depende de userId
  useEffect(() => {
    if (!userId) return;

    // 1. Manejo de permisos y suscripción
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") subscribeToPush();
        });
      } else if (Notification.permission === "granted") {
        subscribeToPush();
      }
    }

    // 2. Socket Connection
    socket.connect();
    socket.emit('join', userId);

    const handleNewNotification = (data) => {
      if (lastProcessedMessage.current === data.message) return; 
      lastProcessedMessage.current = data.message;
      setTimeout(() => { lastProcessedMessage.current = null; }, 3000);

      setNotifications(prev => {
        if (prev.some(n => n.message === data.message)) return prev;
        return [data, ...prev];
      });

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Jade Finance", { body: data.message, icon: "/favicon.ico" });
      }
    };

    socket.on('notification', handleNewNotification);
    
    // Carga inicial de notificaciones
    fetchNotifications();

    return () => {
      socket.off('notification', handleNewNotification);
      socket.disconnect();
    };
    // ❌ Eliminamos fetchNotifications y subscribeToPush de aquí para romper el bucle
  }, [userId]); 

  const deleteNotification = async (id) => {
    if (!id) return; 
    setNotifications(prev => prev.filter(n => n._id !== id));
    try {
      await fetch(`${API_URL}/api/notifications/${id}`, {
        method: "DELETE",
        headers: {
      },
      credentials: 'include' // ✅ Agregamos esto
    });
    } catch (e) {
      console.error("No se pudo eliminar en el servidor");
    }
  };

  const clearAll = async () => {
    setNotifications([]);
    try {
      await fetch(`${API_URL}/api/notifications`, {
        method: 'DELETE',
       headers: {
      },
      credentials: 'include'
      });
    } catch (e) {
      console.error("No se pudo limpiar en el servidor");
    }
  };

  // ... (Resto del renderizado igual)
  const unreadCount = notifications.filter(n => !n.read).length;
  const formatTime = (dateString) => {
    if (!dateString) return 'Hace un momento';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Hace un momento' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const modalBg = darkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200';
  const headerBg = darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100';
  const textColor = darkMode ? 'text-white' : 'text-slate-900';
  const subTextColor = darkMode ? 'text-slate-300' : 'text-slate-700';
  const itemHover = darkMode ? 'hover:bg-slate-800/40 border-slate-800/50' : 'hover:bg-slate-50 border-slate-50';

  return (
    <div className="relative z-[100]">
      <button 
        onClick={() => setShowDropdown(!showDropdown)} 
        className="p-2.5 relative rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-white dark:border-slate-900">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-[-1]" onClick={() => setShowDropdown(false)}></div>
          <div className={`fixed left-4 right-4 mt-3 shadow-2xl rounded-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${modalBg}`}
            style={{ top: '64px', zIndex: 9999 }}>
            <div className={`px-5 py-4 border-b flex justify-between items-center ${headerBg}`}>
              <h3 className={`font-bold text-sm ${textColor}`}>Notificaciones</h3>
              <button onClick={clearAll} className="text-[10px] font-bold text-rose-500 hover:underline uppercase">
                Limpiar todo
              </button>
            </div>
            <div className={`max-h-96 overflow-y-auto ${modalBg}`}>
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">Todo al día por aquí</div>
              ) : (
                notifications.map((n, index) => (
                  <div key={n._id || index} className={`group px-5 py-4 border-b last:border-0 transition-colors relative ${itemHover}`}>
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-sm leading-snug ${subTextColor}`}>{n.message}</p>
                      {n._id && (
                        <button onClick={() => deleteNotification(n._id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all">
                          ✕
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                      {formatTime(n.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;



