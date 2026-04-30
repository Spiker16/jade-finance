import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#080f1a", color: "#e2e8f0", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #10b981; color: #fff; }
        html { scroll-behavior: smooth; }

        .nav-link { cursor: pointer; font-size: 14px; font-weight: 500; color: #94a3b8; transition: color .2s; }
        .nav-link:hover { color: #10b981; }

        .btn-primary {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white; border: none; border-radius: 14px;
          padding: 14px 32px; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all .25s;
          box-shadow: 0 8px 24px rgba(16,185,129,.35);
          font-family: inherit;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(16,185,129,.45); }

        .btn-ghost {
          background: transparent; color: #94a3b8;
          border: 1.5px solid #1e2d3d; border-radius: 14px;
          padding: 13px 28px; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: all .25s; font-family: inherit;
        }
        .btn-ghost:hover { border-color: #10b981; color: #10b981; }

        .feature-card {
          background: linear-gradient(145deg, #0d1b2a, #0f2133);
          border: 1px solid #1a2f44;
          border-radius: 24px; padding: 32px;
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
          border-radius: 20px; padding: 24px 32px; text-align: center;
        }

        .avatar-ring {
          width: 96px; height: 96px; border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex; align-items: center; justify-content: center;
          font-size: 40px; margin: 0 auto 24px;
          box-shadow: 0 0 0 4px rgba(16,185,129,.2), 0 0 40px rgba(16,185,129,.3);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
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

        @media (max-width: 768px) {
          .hero-title { font-size: clamp(36px, 10vw, 56px) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .nav-links { display: none; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 24px",
        background: scrolled ? "rgba(8,15,26,.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid #1a2f44" : "none",
        transition: "all .3s",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "68px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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

        <div className="nav-links" style={{ display: "flex", gap: 32 }}>
          {NAV_LINKS.map((l, i) => (
            <span key={i} className="nav-link" onClick={() => scrollTo(["hero","que-es","funciones","sobre-mi"][i])}>
              {l}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-ghost" style={{ padding: "10px 20px", fontSize: 14 }} onClick={() => navigate("/login")}>
            Iniciar sesión
          </button>
          <button className="btn-primary" style={{ padding: "10px 20px", fontSize: 14 }} onClick={() => navigate("/register")}>
            Registrarse gratis
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero" ref={heroRef} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "120px 24px 80px" }}>
        {/* Orbs de fondo */}
        <div className="glow-orb" style={{ width: 600, height: 600, background: "rgba(16,185,129,.12)", top: -100, left: -200 }} />
        <div className="glow-orb" style={{ width: 400, height: 400, background: "rgba(5,150,105,.08)", bottom: 0, right: -100 }} />

        {/* Grid decorativo */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        <div style={{ maxWidth: 760, textAlign: "center", position: "relative" }}>
          <div className="badge animate-fadeup">
            <span>✨</span> Proyecto personal · Open to feedback
          </div>

          <h1 className="hero-title animate-fadeup delay-1" style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: "clamp(44px, 7vw, 72px)", lineHeight: 1.1,
            color: "#fff", marginBottom: 24,
            letterSpacing: "-1px"
          }}>
            Tus finanzas,<br />
            <span style={{ color: "#10b981" }}>bajo control</span>
          </h1>

          <p className="animate-fadeup delay-2" style={{
            fontSize: 18, color: "#64748b", lineHeight: 1.7,
            maxWidth: 560, margin: "0 auto 40px", fontWeight: 400
          }}>
            Jade Finance es una aplicación gratuita para registrar gastos, crear presupuestos, alcanzar metas de ahorro y gestionar deudas — todo en un solo lugar.
          </p>

          <div className="animate-fadeup delay-3" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => navigate("/register")}>
              Empezar gratis →
            </button>
            <button className="btn-ghost" onClick={() => navigate("/login")}>
              Ya tengo cuenta
            </button>
          </div>

          {/* Mini dashboard flotante */}
          <div className="animate-float animate-fadeup delay-4" style={{
            marginTop: 64, background: "linear-gradient(145deg, #0d1b2a, #0f2133)",
            border: "1px solid #1a2f44", borderRadius: 24, padding: "24px 32px",
            display: "inline-block", textAlign: "left",
            boxShadow: "0 32px 80px rgba(0,0,0,.5)"
          }}>
            <div style={{ fontSize: 12, color: "#10b981", fontWeight: 700, marginBottom: 16, letterSpacing: 1 }}>
              SALDO DISPONIBLE
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800, color: "#fff", marginBottom: 16 }}>
              $2.450.000
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>INGRESOS</div>
                <div style={{ color: "#10b981", fontWeight: 700, fontSize: 15 }}>+$3.200.000</div>
              </div>
              <div style={{ width: 1, background: "#1a2f44" }} />
              <div>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>GASTOS</div>
                <div style={{ color: "#f87171", fontWeight: 700, fontSize: 15 }}>-$750.000</div>
              </div>
              <div style={{ width: 1, background: "#1a2f44" }} />
              <div>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>META</div>
                <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 15 }}>68% ✈️</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUÉ ES */}
      <section id="que-es" style={{ padding: "100px 24px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div className="badge">💡 ¿Qué es Jade Finance?</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: "#fff", marginBottom: 16 }}>
            Una app hecha con pasión,<br />no con presupuesto
          </h2>
          <p style={{ color: "#64748b", fontSize: 17, lineHeight: 1.7, maxWidth: 600, margin: "0 auto" }}>
            Jade Finance nació como proyecto universitario con el objetivo de hacer que el control financiero personal sea accesible, simple y bonito para cualquier persona.
          </p>
        </div>

        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[
            { value: "100%", label: "Gratuito para siempre (plan básico)" },
            { value: "6", label: "Módulos: gastos, metas, deudas y más" },
            { value: "IA", label: "Asistente inteligente con DeepSeek" },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, color: "#10b981", marginBottom: 8 }}>{s.value}</div>
              <div style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FUNCIONES */}
      <section id="funciones" style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div className="badge">⚡ Funciones principales</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: "#fff", marginBottom: 16 }}>
            Todo lo que necesitas en un solo lugar
          </h2>
          <p style={{ color: "#64748b", fontSize: 17 }}>Sin complicaciones. Sin costos ocultos.</p>
        </div>

        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: "#fff", marginBottom: 8 }}>{f.title}</div>
              <div style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SOBRE MÍ */}
      <section id="sobre-mi" style={{ padding: "100px 24px" }}>
        <div style={{
          maxWidth: 680, margin: "0 auto", textAlign: "center",
          background: "linear-gradient(145deg, #0d1b2a, #0f2133)",
          border: "1px solid #1a2f44", borderRadius: 32, padding: "56px 48px"
        }}>
          <div className="avatar-ring">👨‍💻</div>
          <div className="badge" style={{ justifyContent: "center" }}>🎓 El desarrollador</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 16 }}>
            Juan David Espinosa Pascuas
          </h2>
          <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.8, marginBottom: 32 }}>
            Soy estudiante de desarrollo de software y creé Jade Finance como proyecto personal para aprender construyendo algo real. Este proyecto me enseñó sobre autenticación, bases de datos, tiempo real con sockets, integración de pagos e inteligencia artificial.
          </p>
          <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.7, marginBottom: 40 }}>
            Jade Finance es un trabajo en progreso — hay bugs, hay cosas por mejorar y siempre hay ideas nuevas. Si tienes feedback o quieres contribuir, ¡me encantaría escucharte!
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => navigate("/register")}>
              Probar Jade Finance →
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: "1px solid #1a2f44", padding: "32px 24px",
        textAlign: "center", color: "#334155", fontSize: 13
      }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#10b981", fontSize: 16, marginBottom: 8 }}>
          Jade Finance
        </div>
        <div>Desarrollado con ❤️ por <span style={{ color: "#10b981" }}>Juan David Espinosa Pascuas</span> · Proyecto personal · {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
}