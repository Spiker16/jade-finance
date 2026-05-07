import React, { useEffect, useState } from 'react';
import axios from 'axios'; // O fetch si prefieres
import { useNavigate } from 'react-router-dom';

const VoicePage = () => {
  const [status, setStatus] = useState('Esperando...');
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Configurar el reconocimiento de voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus('Tu navegador no soporta voz 😢');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.continuous = false;

    // 2. Iniciar automáticamente
    recognition.start();

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('Te escucho...');
    };

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setStatus(`Procesando: "${text}"`);
      
      try {
        // 3. Enviar a la ruta de tu backend que creamos antes
        await axios.post('/api/transactions/voice', { text }, { withCredentials: true });
        setStatus('✅ ¡Registrado con éxito!');
        
        // Volver al inicio después de 2 segundos
        setTimeout(() => navigate('/'), 2000);
      } catch (error) {
        setStatus('❌ Error al procesar con DeepSeek');
        console.error(error);
      }
    };

    recognition.onerror = (e) => {
      setStatus('Error de micrófono');
      setIsListening(false);
    };

  }, [navigate]);

  return (
    <div className="h-screen w-full bg-[#0B1121] flex flex-col items-center justify-center text-white p-6 text-center">
      <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all ${isListening ? 'bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-pulse' : 'bg-slate-800'}`}>
        <span className="text-5xl">🎤</span>
      </div>
      <h1 className="text-2xl font-bold mb-2">{status}</h1>
      <p className="text-slate-400 italic">"Di algo como: Registra 50 mil en comida"</p>
    </div>
  );
};

const VoiceSettings = () => {
  const urlDeVoz = "https://jade-finance.com/voz"; // Cambia por tu dominio real

  const configurarGoogle = () => {
    // 1. Copiamos la URL al portapapeles para facilitarle la vida al usuario
    navigator.clipboard.writeText(urlDeVoz);
    alert("URL de voz copiada. Ahora pégala en la acción de la Rutina de Google.");
    
    // 2. Abrimos la configuración de Rutinas de Google
    window.location.href = "https://assistant.google.com/settings/routines";
  };

  return (
    <div className="p-4 bg-slate-800 rounded-2xl mt-4">
      <h3 className="font-bold">🎙️ Comandos de Voz</h3>
      <p className="text-sm text-slate-400 mb-3">Usa "Ok Google" para registrar gastos.</p>
      <button 
        onClick={configurarGoogle}
        className="w-full py-2 bg-emerald-500 text-white rounded-lg font-medium"
      >
        Configurar en Google Assistant
      </button>
    </div>
  );
};

export default VoicePage;