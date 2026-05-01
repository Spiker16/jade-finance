import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // 👈 Añadimos Navigate
import React from 'react';
import Layout from './components/Layout'; 
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Reports from './pages/Reports'; 
import Login from './pages/Login';
import Register from './pages/Register';
import Budgets from './pages/Budgets';
import Accounts from './pages/Accounts';
import NotificationBell from './components/NotificationBell';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';  
import Upgrade from './pages/Upgrade';
import PaymentResult from './pages/PaymentResult';
import LandingPage from './pages/LandingPage';

// ==========================================
// 1. COMPONENTE GUARDIA (ProtectedRoute)
// ==========================================
// Este componente revisa si existe un usuario en localStorage
// La autenticación real se maneja via cookies HttpOnly
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  
  if (!user) {
    // Si no hay usuario, redirige al login y limpia el historial para que no pueda volver atrás
    return <Navigate to="/login" replace />;
  }

  return children;
};
const PWARedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isPWA = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      new URLSearchParams(window.location.search).get('pwa') === 'true';

    if (isPWA && location.pathname === '/') {
      navigate('/login', { replace: true });
    }
  }, []);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/payment-result" element={<PaymentResult />} />
        {/* 🛡️ Rutas Protegidas dentro del Layout */}
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/goals" element={<Goals />} /> 
          <Route path="/reports" element={<Reports />} /> 
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Ruta por defecto: Si no existe la ruta o no está logueado, al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;



