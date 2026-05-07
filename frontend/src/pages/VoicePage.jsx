import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config.js';

const VoicePage = () => {
  const [status, setStatus] = useState('Mantén presionado para hablar');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    if (isProcessing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        setStatus('Procesando...');
        stream.getTracks().forEach(track => track.stop());

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'audio.webm');

        try {
          // 1. Transcribir con Groq Whisper
          const transcRes = await fetch(`${API_URL}/api/ai/transcribir`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });

          if (!transcRes.ok) throw new Error('Error al transcribir');
          const { texto } = await transcRes.json();
          setStatus(`Entendí: "${texto}"`);

          // 2. Registrar transacción
          const voiceRes = await fetch(`${API_URL}/api/transactions/voice`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: texto }),
          });

          if (!voiceRes.ok) throw new Error('Error al registrar');

          setStatus('✅ ¡Registrado con éxito!');
          setTimeout(() => navigate('/dashboard'), 2000);

        } catch (error) {
          console.error(error);
          setStatus('❌ Error al procesar — intenta de nuevo');
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      setStatus('Te escucho... suelta cuando termines');

    } catch (error) {
      setStatus('❌ No se pudo acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#0B1121] flex flex-col items-center justify-center text-white p-6 text-center">
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
        onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
        disabled={isProcessing}
        className={`w-36 h-36 rounded-full flex items-center justify-center mb-8 transition-all select-none ${
          isProcessing
            ? 'bg-slate-700 cursor-not-allowed'
            : isListening
            ? 'bg-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.5)] animate-pulse scale-110'
            : 'bg-slate-800 hover:bg-slate-700 active:scale-95 cursor-pointer'
        }`}
      >
        <span className="text-5xl pointer-events-none">
          {isProcessing ? '⏳' : '🎤'}
        </span>
      </button>

      <h1 className="text-2xl font-bold mb-2">{status}</h1>

      <p className="text-slate-400 italic mb-8 text-sm">
        Ejemplo: "Gasté 50 mil en comida" o "Me pagaron 200 mil"
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