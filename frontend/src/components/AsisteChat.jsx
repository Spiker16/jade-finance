import React, { useState, useRef, useEffect } from "react";
import PremiumModal from "../components/PremiumModal";
import { useOutletContext } from "react-router-dom";
import API_URL from '../config.js';

const PREGUNTAS_RAPIDAS = [
  "¿En qué gasto más?",
  "¿Cómo puedo ahorrar?",
  "¿Cuál es mi balance?",
  "¿Mis gastos son normales?",
];

export default function AsisteChat() {
  const context = useOutletContext() || {};
  const darkMode = context.darkMode !== undefined ? context.darkMode : true;

  const [abierto, setAbierto]   = useState(false);
  const [mostrarSaludo, setMostrarSaludo] = useState(true); 
  const [mensajes, setMensajes] = useState([
    {
      role: "assistant",
      content: "¡Hola! Soy JADE 💚 Tu asistente financiero personal. Puedo analizar tus gastos e ingresos de los últimos 60 días. ¿En qué te puedo ayudar?",
    },
  ]);
  const [input, setInput]       = useState("");
  const [cargando, setCargando] = useState(false);
  const bottomRef               = useRef(null);
  const textareaRef             = useRef(null);

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);

  // ⬅️ Se generan los estilos dinámicamente según el modo
  const styles = getStyles(darkMode);

  useEffect(() => {
    if (abierto) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [mensajes, cargando, abierto]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMostrarSaludo(false);
    }, 5500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (abierto) setMostrarSaludo(false);
  }, [abierto]);

  const enviarMensaje = async (texto) => {
    const pregunta = texto || input.trim();
    if (!pregunta || cargando) return;

    const nuevosMensajes = [...mensajes, { role: "user", content: pregunta }];
    setMensajes(nuevosMensajes);
    setInput("");
    setCargando(true);

    try {
      const res = await fetch("http://localhost:3000/api/ai/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pregunta,
          historialChat: nuevosMensajes.slice(1),
        }),
      });

      if (res.status === 403) {
        const data = await res.json();
        setLimitInfo(data);
        setShowPremiumModal(true);
        setMensajes((prev) => prev.slice(0, -1)); 
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error desconocido");

      setMensajes((prev) => [
        ...prev,
        { role: "assistant", content: data.respuesta },
      ]);
    } catch (err) {
      setMensajes((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Hubo un error al consultar el asistente. Intenta de nuevo.",
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  return (
    <>
      {/* ── VENTANA DEL CHAT ── */}
      {abierto && (
        <div className="chat-window-responsive" style={styles.chatWindow}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.avatar}>
                <img src="/favicon.svg" alt="Jade Logo" style={{ width: 20, height: 20 }} />
              </div>
              <div>
                <p style={styles.headerTitle}>JADE</p>
                <p style={styles.headerSub}>Asistente financiero · Premium</p>
              </div>
            </div>
            <button style={styles.closeBtn} onClick={() => setAbierto(false)}>✕</button>
          </div>

          {/* Mensajes */}
          <div style={styles.mensajesContainer}>
            {mensajes.map((m, i) => (
              <div
                key={i}
                style={{
                  ...styles.mensajeRow,
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {m.role === "assistant" && (
                  <div style={styles.avatarSmall}>
                    <img src="/favicon.svg" alt="Jade Logo" style={{ width: 14, height: 14 }} />
                  </div>
                )}
                <div
                  style={{
                    ...styles.burbuja,
                    ...(m.role === "user" ? styles.burbujaUser : styles.burbujaAI),
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {cargando && (
              <div style={{ ...styles.mensajeRow, justifyContent: "flex-start" }}>
                <div style={styles.avatarSmall}>
                  <img src="/favicon.svg" alt="Jade Logo" style={{ width: 14, height: 14 }} />
                </div>
                <div style={{ ...styles.burbuja, ...styles.burbujaAI }}>
                  <span style={styles.dotsWrap}>
                    <span style={{ ...styles.dot, animationDelay: "0s" }} />
                    <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
                    <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Preguntas rápidas — solo al inicio */}
          {mensajes.length <= 1 && (
            <div style={styles.preguntasRapidas}>
              {PREGUNTAS_RAPIDAS.map((p) => (
                <button key={p} style={styles.chipBtn} onClick={() => enviarMensaje(p)}>
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={styles.inputArea}>
            <textarea
              ref={textareaRef}
              style={styles.textarea}
              placeholder="Escribe tu pregunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={cargando}
            />
            <button
              style={{
                ...styles.sendBtn,
                opacity: !input.trim() || cargando ? 0.4 : 1,
                cursor: !input.trim() || cargando ? "not-allowed" : "pointer",
              }}
              onClick={() => enviarMensaje()}
              disabled={!input.trim() || cargando}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* ── BURBUJA DE SALUDO TEMPORAL ── */}
      {mostrarSaludo && !abierto && (
        <div className="saludo-tooltip" onClick={() => setAbierto(true)}>
           ¡Hola! Soy JADE 💚 Tu asistente financiero personal 👋
        </div>
      )}

      {/* ── BOTÓN FLOTANTE ── */}
      <button
        className="fab-responsive"
        style={{
          ...styles.fab,
          ...(abierto ? styles.fabAbierto : {}),
        }}
        onClick={() => setAbierto(!abierto)}
        title="Asistente JADE"
      >
        {abierto ? (
          <span style={{ fontSize: 24 }}>✕</span>
        ) : (
          <img 
            src="/favicon.svg" 
            alt="Jade AI" 
            style={{ width: 34, height: 34, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }} 
          />
        )}
      </button>

      {/* ── MODAL PREMIUM ── */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        limitInfo={{ ...limitInfo, isDarkMode: darkMode }}
      />

      {/* ESTILOS RESPONSIVOS Y ANIMACIONES DINÁMICAS */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }

        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(10px) translateY(0); }
          10% { opacity: 1; transform: translateX(0) translateY(0); }
          90% { opacity: 1; transform: translateX(0) translateY(0); }
          100% { opacity: 0; transform: translateX(10px) translateY(0); pointer-events: none; }
        }

        .chat-window-responsive {
          width: 360px;
          bottom: 100px;
          right: 40px; 
        }
        .fab-responsive {
          bottom: 30px;
          right: 40px; 
        }

        /* ── Tooltip de saludo adaptable a tema ── */
        .saludo-tooltip {
          position: fixed;
          bottom: 42px; 
          right: 110px; 
          background: ${darkMode ? "#1e293b" : "#ffffff"};
          color: ${darkMode ? "#e2e8f0" : "#1e293b"};
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          border: 1px solid ${darkMode ? "#334155" : "#e2e8f0"};
          animation: fadeInOut 5.5s forwards; 
          z-index: 9998;
          cursor: pointer;
        }

        .saludo-tooltip::after {
          content: "";
          position: absolute;
          top: 50%;
          right: -6px;
          transform: translateY(-50%);
          border-width: 6px 0 6px 6px;
          border-style: solid;
          border-color: transparent transparent transparent ${darkMode ? "#334155" : "#e2e8f0"};
        }
        .saludo-tooltip::before {
          content: "";
          position: absolute;
          top: 50%;
          right: -4px;
          transform: translateY(-50%);
          border-width: 5px 0 5px 5px;
          border-style: solid;
          border-color: transparent transparent transparent ${darkMode ? "#1e293b" : "#ffffff"};
          z-index: 1;
        }

        /* Modificador del placeholder del input según el tema */
        textarea::placeholder {
          color: ${darkMode ? "#94a3b8" : "#94a3b8"}; 
        }

        @media (max-width: 768px) {
          .fab-responsive {
            bottom: 90px;
            right: 16px;
          }
          .chat-window-responsive {
            width: calc(100vw - 32px);
            bottom: 160px;
            right: 16px;
          }
          .saludo-tooltip {
            bottom: 102px; 
            right: 86px;
          }
        }
      `}</style>
    </>
  );
}

// ⬅️ Función que calcula los colores en vivo dependiendo del darkMode
const getStyles = (darkMode) => ({
  chatWindow: {
    position: "fixed",
    height: "500px",
    display: "flex",
    flexDirection: "column",
    background: darkMode ? "#0f172a" : "#ffffff",
    borderRadius: "20px",
    border: `1px solid ${darkMode ? "#1e293b" : "#e2e8f0"}`,
    boxShadow: darkMode 
      ? "0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.15)"
      : "0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(16,185,129,0.1)",
    overflow: "hidden",
    fontFamily: "'Segoe UI', sans-serif",
    zIndex: 9999,
    animation: "slideUp 0.25s ease",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: darkMode ? "#1e293b" : "#f8fafc",
    borderBottom: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #10b981, #065f46)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 0 10px rgba(16,185,129,0.4)",
  },
  headerTitle: {
    margin: 0,
    fontWeight: 700,
    color: darkMode ? "#f0fdf4" : "#0f172a",
    fontSize: 14,
    letterSpacing: "0.08em",
  },
  headerSub: {
    margin: 0,
    fontSize: 10,
    color: darkMode ? "#64748b" : "#64748b",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#64748b",
    fontSize: 14,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "8px",
    transition: "color 0.2s",
  },
  mensajesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  mensajeRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "7px",
  },
  avatarSmall: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #10b981, #065f46)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  burbuja: {
    maxWidth: "78%",
    padding: "9px 13px",
    borderRadius: "14px",
    fontSize: 13,
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
  },
  burbujaAI: {
    background: darkMode ? "#1e293b" : "#f1f5f9",
    color: darkMode ? "#e2e8f0" : "#1e293b",
    borderBottomLeftRadius: 4,
    border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
  },
  burbujaUser: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    borderBottomRightRadius: 4,
  },
  dotsWrap: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
    padding: "2px 0",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#10b981",
    display: "inline-block",
    animation: "bounce 1.2s infinite",
  },
  preguntasRapidas: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    padding: "0 14px 10px",
  },
  chipBtn: {
    background: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.35)",
    color: "#10b981",
    borderRadius: "20px",
    padding: "4px 11px",
    fontSize: 11,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  inputArea: {
    display: "flex",
    gap: "8px",
    padding: "10px 14px",
    borderTop: `1px solid ${darkMode ? "#1e293b" : "#e2e8f0"}`,
    background: darkMode ? "#1e293b" : "#f8fafc",
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    background: darkMode ? "#0f172a" : "#ffffff",
    border: `1px solid ${darkMode ? "#334155" : "#cbd5e1"}`,
    borderRadius: "12px",
    padding: "9px 13px",
    color: darkMode ? "#e2e8f0" : "#0f172a",
    fontSize: 13,
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: 1.4,
  },
  sendBtn: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    width: 38,
    height: 38,
    fontSize: 15,
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
  },
  fab: {
    position: "fixed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "60px",
    height: "60px",
    padding: "0",
    background: "linear-gradient(135deg, #10b981, #059669)",
    border: "none",
    borderRadius: "50%",
    color: "#fff",
    cursor: "pointer",
    zIndex: 9999,
    boxShadow: "0 8px 24px rgba(16,185,129,0.45)",
    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
  },
  fabAbierto: {
    background: darkMode ? "#1e293b" : "#ffffff",
    transform: "rotate(90deg)",
    boxShadow: darkMode 
      ? "0 4px 16px rgba(0,0,0,0.4)" 
      : "0 4px 16px rgba(0,0,0,0.15)",
    color: darkMode ? "#fff" : "#333",
  },
});



