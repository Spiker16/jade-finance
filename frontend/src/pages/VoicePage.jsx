import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config.js';

const VoicePage = () => {
  const [status, setStatus] = useState('Esperando...');
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus('Tu navegador no soporta voz 😢');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.start();

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('Te escucho...');
    };

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setStatus(`Procesando: "${text}"`);

      try {
        const response = await fetch(`${API_URL}/api/transactions/voice`, { // ✅ URL corregida
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) throw new Error('Error en la petición');

        setStatus('✅ ¡Registrado con éxito!');
        setTimeout(() => navigate('/dashboard'), 2000); // ✅ va al dashboard, no a /

      } catch (error) {
        console.error(error);
        setStatus('❌ Error al procesar el comando');
      }
    };

    recognition.onerror = (e) => {
      console.error(e);
      if (e.error === 'network') {
        setStatus('❌ Error de red — intenta de nuevo');
      } else if (e.error === 'not-allowed') {
        setStatus('❌ Permiso de micrófono denegado');
      } else {
        setStatus(`❌ Error: ${e.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    return () => recognition.stop();
  }, [navigate]);

  return (
    <div className="h-screen w-full bg-[#0B1121] flex flex-col items-center justify-center text-white p-6 text-center">
      <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all ${
        isListening
          ? 'bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-pulse'
          : 'bg-slate-800'
      }`}>
        <span className="text-5xl">🎤</span>
      </div>

      <h1 className="text-2xl font-bold mb-2">{status}</h1>

      <p className="text-slate-400 italic mb-6">
        "Di algo como: Registra 50 mil en comida"
      </p>

      <button
        onClick={() => navigate('/dashboard')}
        className="text-slate-500 hover:text-white text-sm transition-colors"
      >
        ← Volver al dashboard
      </button>
    </div>
  );
};

export default VoicePage;