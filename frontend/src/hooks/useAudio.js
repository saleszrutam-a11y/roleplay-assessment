import { useRef, useState, useCallback } from 'react';

export default function useAudio(sendMessage, sendBinary) {
  const [isRecording, setIsRecording] = useState(false);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      // Use browser's native sample rate — don't force 16kHz
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Resume AudioContext if suspended (Chrome autoplay policy)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      const actualSampleRate = audioContext.sampleRate;
      console.log('AudioContext sample rate:', actualSampleRate, 'state:', audioContext.state);

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // ScriptProcessorNode to capture raw PCM
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      let logCount = 0;
      processor.onaudioprocess = (e) => {
        const float32Data = e.inputBuffer.getChannelData(0);

        // Log volume level for first few chunks to verify mic is working
        if (logCount < 5) {
          let maxVal = 0;
          for (let i = 0; i < float32Data.length; i++) {
            const abs = Math.abs(float32Data[i]);
            if (abs > maxVal) maxVal = abs;
          }
          console.log(`Audio chunk ${logCount}: max amplitude = ${maxVal.toFixed(4)}, samples = ${float32Data.length}`);
          logCount++;
        }

        // Convert Float32 to Int16 (linear16)
        const int16Data = new Int16Array(float32Data.length);
        for (let i = 0; i < float32Data.length; i++) {
          const s = Math.max(-1, Math.min(1, float32Data[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        sendBinary(int16Data.buffer);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // Tell backend to start Deepgram stream with actual sample rate
      sendMessage({ type: 'start_stream', sampleRate: actualSampleRate });
      setIsRecording(true);
    } catch (err) {
      console.error('Mic access error:', err);
      alert('Microphone access is required for this assessment. Please allow microphone permissions.');
    }
  }, [sendMessage, sendBinary]);

  const stopRecording = useCallback(() => {
    // Tell backend to stop Deepgram stream
    sendMessage({ type: 'stop_stream' });

    // Clean up audio nodes
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  }, [sendMessage]);

  return { startRecording, stopRecording, isRecording };
}
