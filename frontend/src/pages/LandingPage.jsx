import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

useEffect(() => {
  const isPWA = 
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    new URLSearchParams(window.location.search).get('pwa') === 'true';
  
    if (isPWA) {
        navigate('/login');
    }
    }, []);

    
const NAV_LINKS = ["Inicio", "¿Qué es?", "Funciones", "Sobre mí"];

const FEATURES = [
  { icon: "📊", title: "Dashboard inteligente", desc: "Visualiza tus ingresos y gastos del día en tiempo real con gráficas claras." },
  { icon: "🎯", title: "Metas de ahorro", desc: "Define objetivos y abona dinero gradualmente hasta alcanzarlos." },
  { icon: "💳", title: "Control de deudas", desc: "Registra y programa pagos para nunca perder el hilo de lo que debes." },
  { icon: "📦", title: "Presupuestos", desc: "Asigna límites por categoría y recibe alertas antes de excederlos." },
  { icon: "🔔", title: "Notificaciones en tiempo real", desc: "Alertas instantáneas vía Socket.IO cuando superas un presupuesto." },
  { icon: "⭐", title: "Asistente IA Premium", desc: "JADE analiza tus finanzas y te da consejos personalizados con IA." },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // PWA Install
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);


  
  useEffect(() => {
    const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
    if (isIOSDevice) setShowInstallBtn(true);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBtn(false);
    setDeferredPrompt(null);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#080f1a", color: "#e2e8f0", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #10b981; color: #fff; }
        html { scroll-behavior: smooth; }

        .btn-primary {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white; border: none; border-radius: 14px;
          padding: 14px 28px; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all .25s;
          box-shadow: 0 8px 24px rgba(16,185,129,.35);
          font-family: inherit; white-space: nowrap;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(16,185,129,.45); }

        .btn-ghost {
          background: transparent; color: #94a3b8;
          border: 1.5px solid #1e2d3d; border-radius: 14px;
          padding: 13px 24px; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: all .25s; font-family: inherit;
          white-space: nowrap;
        }
        .btn-ghost:hover { border-color: #10b981; color: #10b981; }

        .btn-install {
          background: transparent; color: #10b981;
          border: 1.5px solid #10b981; border-radius: 14px;
          padding: 13px 24px; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: all .25s; font-family: inherit;
          white-space: nowrap;
        }
        .btn-install:hover { background: rgba(16,185,129,0.1); transform: translateY(-2px); }

        .feature-card {
          background: linear-gradient(145deg, #0d1b2a, #0f2133);
          border: 1px solid #1a2f44;
          border-radius: 24px; padding: 28px;
          transition: all .3s; position: relative; overflow: hidden;
        }
        .feature-card::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(16,185,129,.05), transparent);
          opacity: 0; transition: opacity .3s;
        }
        .feature-card:hover { transform: translateY(-4px); border-color: rgba(16,185,129,.3); }
        .feature-card:hover::before { opacity: 1; }

        .glow-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none;
        }

        .badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.25);
          color: #10b981; border-radius: 999px;
          padding: 6px 16px; font-size: 13px; font-weight: 600;
          margin-bottom: 24px;
        }

        .stat-card {
          background: rgba(16,185,129,.07);
          border: 1px solid rgba(16,185,129,.15);
          border-radius: 20px; padding: 24px 20px; text-align: center;
        }

        .avatar-ring {
          width: 88px; height: 88px; border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex; align-items: center; justify-content: center;
          font-size: 36px; margin: 0 auto 24px;
          box-shadow: 0 0 0 4px rgba(16,185,129,.2), 0 0 40px rgba(16,185,129,.3);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-fadeup { animation: fadeUp .7s ease forwards; }
        .delay-1 { animation-delay: .1s; opacity: 0; }
        .delay-2 { animation-delay: .25s; opacity: 0; }
        .delay-3 { animation-delay: .4s; opacity: 0; }
        .delay-4 { animation-delay: .55s; opacity: 0; }

        .nav-desktop-links { display: flex; gap: 28px; }
        .nav-desktop-btns { display: flex; gap: 10px; }
        .nav-link { cursor: pointer; font-size: 14px; font-weight: 500; color: #94a3b8; transition: color .2s; }
        .nav-link:hover { color: #10b981; }
        .hamburger { display: none; background: none; border: none; cursor: pointer; padding: 8px; }

        .mobile-menu {
          display: none; position: fixed; top: 68px; left: 0; right: 0;
          background: rgba(8,15,26,.98); backdrop-filter: blur(16px);
          border-bottom: 1px solid #1a2f44; padding: 20px 24px;
          flex-direction: column; gap: 4px; z-index: 99;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu .nav-link { font-size: 16px; padding: 14px 0; border-bottom: 1px solid #1a2f44; }
        .mobile-btns { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
        .mobile-btns button { width: 100%; text-align: center; padding: 14px !important; }

        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

        .dashboard-card {
          margin-top: 56px;
          background: linear-gradient(145deg, #0d1b2a, #0f2133);
          border: 1px solid #1a2f44; border-radius: 24px; padding: 24px 28px;
          display: inline-block; text-align: left;
          box-shadow: 0 32px 80px rgba(0,0,0,.5);
          width: 100%; max-width: 420px;
        }
        .dashboard-stats { display: flex; gap: 20px; flex-wrap: wrap; }
        .divider { width: 1px; background: #1a2f44; }

        @media (max-width: 768px) {
          .nav-desktop-links { display: none !important; }
          .nav-desktop-btns { display: none !important; }
          .hamburger { display: flex !important; align-items: center; justify-content: center; }

          .hero-section { padding: 100px 20px 60px !important; }
          .hero-inner { text-align: left !important; }
          .hero-title { font-size: clamp(32px, 9vw, 50px) !important; }
          .hero-desc { margin-left: 0 !important; margin-right: 0 !important; text-align: left !important; }
          .hero-btns { justify-content: flex-start !important; }
          .hero-badge { display: flex !important; }

          .dashboard-card { padding: 18px 20px !important; margin-top: 40px !important; }
          .dashboard-amount { font-size: 26px !important; }
          .divider { display: none !important; }
          .dashboard-stats { gap: 16px; }

          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-grid .stat-card:last-child { grid-column: 1 / -1; }

          .features-grid { grid-template-columns: 1fr !important; gap: 12px !important; }

          .section-pad { padding: 64px 20px !important; }
          .sobre-mi-card { padding: 32px 20px !important; }
          .section-max { padding-left: 20px !important; padding-right: 20px !important; }
        }

        @media (max-width: 400px) {
          .hero-title { font-size: 28px !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 20px",
        background: scrolled ? "rgba(8,15,26,.95)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid #1a2f44" : "none",
        transition: "all .3s",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "68px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            borderRadius: 12, width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "white",
            boxShadow: "0 4px 12px rgba(16,185,129,.4)"
          }}>J</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>
            Jade<span style={{ color: "#10b981" }}>Finance</span>
          </span>
        </div>

        <div className="nav-desktop-links">
          {NAV_LINKS.map((l, i) => (
            <span key={i} className="nav-link" onClick={() => scrollTo(["hero","que-es","funciones","sobre-mi"][i])}>{l}</span>
          ))}
        </div>

        <div className="nav-desktop-btns">
          {showInstallBtn && (
            <button className="btn-install" style={{ padding: "10px 18px", fontSize: 14 }} onClick={handleInstall}>
              📲 Instalar app
            </button>
          )}
          <button className="btn-ghost" style={{ padding: "10px 18px", fontSize: 14 }} onClick={() => navigate("/login")}>Iniciar sesión</button>
          <button className="btn-primary" style={{ padding: "10px 18px", fontSize: 14 }} onClick={() => navigate("/register")}>Registrarse</button>
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {NAV_LINKS.map((l, i) => (
          <span key={i} className="nav-link" onClick={() => scrollTo(["hero","que-es","funciones","sobre-mi"][i])}>{l}</span>
        ))}
        <div className="mobile-btns">
          {showInstallBtn && (
            <button className="btn-install" onClick={() => { setMenuOpen(false); handleInstall(); }}>
              📲 Instalar app
            </button>
          )}
          <button className="btn-ghost" onClick={() => { setMenuOpen(false); navigate("/login"); }}>Iniciar sesión</button>
          <button className="btn-primary" onClick={() => { setMenuOpen(false); navigate("/register"); }}>Registrarse gratis</button>
        </div>
      </div>

      {/* HERO */}
      <section id="hero" ref={heroRef} className="hero-section" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "120px 24px 80px" }}>
        <div className="glow-orb" style={{ width: 500, height: 500, background: "rgba(16,185,129,.12)", top: -80, left: -150 }} />
        <div className="glow-orb" style={{ width: 350, height: 350, background: "rgba(5,150,105,.08)", bottom: 0, right: -80 }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="hero-inner" style={{ maxWidth: 760, textAlign: "center", position: "relative", width: "100%" }}>
          <div className="badge animate-fadeup hero-badge">
            <span>✨</span> Proyecto personal · Open to feedback
          </div>

          <h1 className="hero-title animate-fadeup delay-1" style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: "clamp(36px, 7vw, 72px)", lineHeight: 1.1,
            color: "#fff", marginBottom: 20, letterSpacing: "-1px"
          }}>
            Tus finanzas,<br /><span style={{ color: "#10b981" }}>bajo control</span>
          </h1>

          <p className="animate-fadeup delay-2 hero-desc" style={{
            fontSize: 16, color: "#64748b", lineHeight: 1.7,
            maxWidth: 520, margin: "0 auto 32px"
          }}>
            Jade Finance es una aplicación gratuita para registrar gastos, crear presupuestos, alcanzar metas de ahorro y gestionar deudas — todo en un solo lugar.
          </p>

          <div className="animate-fadeup delay-3 hero-btns" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => navigate("/register")}>Empezar gratis →</button>
            <button className="btn-ghost" onClick={() => navigate("/login")}>Ya tengo cuenta</button>
            {showInstallBtn && (
              <button className="btn-install" onClick={handleInstall}>📲 Instalar app</button>
            )}
          </div>

          <div className="animate-float animate-fadeup delay-4 dashboard-card">
            <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, marginBottom: 12, letterSpacing: 1 }}>SALDO DISPONIBLE</div>
            <div className="dashboard-amount" style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 16 }}>$2.450.000</div>
            <div className="dashboard-stats">
              <div>
                <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>INGRESOS</div>
                <div style={{ color: "#10b981", fontWeight: 700, fontSize: 14 }}>+$3.200.000</div>
              </div>
              <div className="divider" />
              <div>
                <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>GASTOS</div>
                <div style={{ color: "#f87171", fontWeight: 700, fontSize: 14 }}>-$750.000</div>
              </div>
              <div className="divider" />
              <div>
                <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>META</div>
                <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 14 }}>68% ✈️</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUÉ ES */}
      <section id="que-es" className="section-pad section-max" style={{ padding: "100px 24px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="badge">💡 ¿Qué es Jade Finance?</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(24px, 5vw, 40px)", fontWeight: 800, color: "#fff", marginBottom: 16 }}>
            Una app hecha con pasión,<br />no con presupuesto
          </h2>
          <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, maxWidth: 540, margin: "0 auto" }}>
            Jade Finance nació como proyecto universitario con el objetivo de hacer que el control financiero personal sea accesible, simple y bonito para cualquier persona.
          </p>
        </div>
        <div className="stats-grid">
          {[
            { value: "100%", label: "Gratuito para siempre (plan básico)" },
            { value: "6", label: "Módulos: gastos, metas, deudas y más" },
            { value: "IA", label: "Asistente inteligente con DeepSeek" },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: "#10b981", marginBottom: 8 }}>{s.value}</div>
              <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FUNCIONES */}
      <section id="funciones" className="section-pad section-max" style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="badge">⚡ Funciones principales</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(24px, 5vw, 40px)", fontWeight: 800, color: "#fff", marginBottom: 12 }}>
            Todo lo que necesitas en un solo lugar
          </h2>
          <p style={{ color: "#64748b", fontSize: 15 }}>Sin complicaciones. Sin costos ocultos.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{ fontSize: 30, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 6 }}>{f.title}</div>
              <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SOBRE MÍ */}
      <section id="sobre-mi" className="section-pad" style={{ padding: "100px 24px" }}>
        <div className="sobre-mi-card" style={{
          maxWidth: 620, margin: "0 auto", textAlign: "center",
          background: "linear-gradient(145deg, #0d1b2a, #0f2133)",
          border: "1px solid #1a2f44", borderRadius: 28, padding: "48px 40px"
        }}>
          <div className="avatar-ring">👨‍💻</div>
          <div className="badge" style={{ justifyContent: "center" }}>🎓 El desarrollador</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 800, color: "#fff", marginBottom: 16 }}>
            Juan David Espinosa Pascuas
          </h2>
          <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.8, marginBottom: 20 }}>
            Soy estudiante de desarrollo de software y creé Jade Finance como proyecto personal para aprender construyendo algo real. Este proyecto me enseñó sobre autenticación, bases de datos, tiempo real con sockets, integración de pagos e inteligencia artificial.
          </p>
          <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.7, marginBottom: 32 }}>
            Jade Finance es un trabajo en progreso — hay bugs, hay cosas por mejorar y siempre hay ideas nuevas. Si tienes feedback o quieres contribuir, ¡me encantaría escucharte!
          </p>
          <button className="btn-primary" onClick={() => navigate("/register")}>Probar Jade Finance →</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #1a2f44", padding: "28px 24px", textAlign: "center", color: "#334155", fontSize: 13 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#10b981", fontSize: 15, marginBottom: 6 }}>Jade Finance</div>
        <div>Desarrollado con ❤️ por <span style={{ color: "#10b981" }}>Juan David Espinosa Pascuas</span> · Proyecto personal · {new Date().getFullYear()}</div>
      </footer>

      {/* MODAL iOS */}
      {showIOSInstructions && (
        <div
          onClick={() => setShowIOSInstructions(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            padding: "0 16px 24px"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#0d1b2a", border: "1px solid #1a2f44",
              borderRadius: 24, padding: "28px 24px", width: "100%",
              maxWidth: 400, textAlign: "center"
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>📱</div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", color: "#fff", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
              Instalar en iPhone
            </h3>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              Safari no permite instalación directa. Sigue estos pasos:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {[
                { num: "1", text: "Toca el botón compartir", icon: "⬆️" },
                { num: "2", text: '"Añadir a pantalla de inicio"', icon: "➕" },
                { num: "3", text: 'Toca "Añadir" — ¡listo!', icon: "✅" },
              ].map(step => (
                <div key={step.num} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "rgba(16,185,129,0.07)", borderRadius: 14,
                  padding: "12px 16px", textAlign: "left"
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, color: "#fff", fontWeight: 800, flexShrink: 0
                  }}>{step.num}</div>
                  <span style={{ color: "#e2e8f0", fontSize: 14 }}>{step.icon} {step.text}</span>
                </div>
              ))}
            </div>
            <button
              className="btn-primary"
              onClick={() => setShowIOSInstructions(false)}
              style={{ width: "100%" }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}