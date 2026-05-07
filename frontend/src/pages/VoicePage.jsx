import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VoicePage = () => {
  const [status, setStatus] = useState('Esperando...');
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Configurar reconocimiento de voz
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

    // Iniciar reconocimiento
    recognition.start();

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('Te escucho...');
    };

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;

      setStatus(`Procesando: "${text}"`);

      try {
        const response = await fetch('/api/transactions/voice', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error('Error en la petición');
        }

        setStatus('✅ ¡Registrado con éxito!');

        setTimeout(() => {
          navigate('/');
        }, 2000);

      } catch (error) {
        console.error(error);
        setStatus('❌ Error al procesar con DeepSeek');
      }
    };

    recognition.onerror = (e) => {
      console.error(e);

      setStatus('Error de micrófono');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      recognition.stop();
    };
  }, [navigate]);

  return (
    <div className="h-screen w-full bg-[#0B1121] flex flex-col items-center justify-center text-white p-6 text-center">
      <div
        className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all ${
          isListening
            ? 'bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-pulse'
            : 'bg-slate-800'
        }`}
      >
        <span className="text-5xl">🎤</span>
      </div>

      <h1 className="text-2xl font-bold mb-2">{status}</h1>

      <p className="text-slate-400 italic">
        "Di algo como: Registra 50 mil en comida"
      </p>
    </div>
  );
};

export default VoicePage;