import { useEffect, useRef } from 'react';

export function LiveVisualizer({ isListening }) {
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    
    if (!isListening) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
      return;
    }

    const initAudio = async () => {
      try {
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioCtxRef.current = audioCtx;

        
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8; 

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        
        const draw = () => {
          frameRef.current = requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          
          ctx.fillStyle = '#f43f5e'; 
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(244, 63, 94, 0.8)';

          const barWidth = 4;
          const gap = 3;
          const center = canvas.width / 2;

          
          for (let i = 0; i < 12; i++) {
            const percent = dataArray[i] / 255;
            
            const barHeight = Math.max(2, percent * canvas.height); 
            const y = (canvas.height - barHeight) / 2;

            
            ctx.fillRect(center + (i * (barWidth + gap)), y, barWidth, barHeight);
          
            if (i !== 0) {
              ctx.fillRect(center - (i * (barWidth + gap)), y, barWidth, barHeight);
            }
          }
        };

        draw();
      } catch (err) {
        console.error("Audio visualizer failed to initialize:", err);
      }
    };

    initAudio();

    
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [isListening]);

  return (
    
      
      
        LISTENING
      
    
  );
}