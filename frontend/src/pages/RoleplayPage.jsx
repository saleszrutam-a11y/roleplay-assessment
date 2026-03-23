import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AvatarCard from '../components/AvatarCard';
import TranscriptPanel from '../components/TranscriptPanel';
import ProtocolChecklist from '../components/ProtocolChecklist';
import useWebSocket from '../hooks/useWebSocket';
import useAudio from '../hooks/useAudio';
import useSession from '../hooks/useSession';

// Protocol keyword patterns for auto-checking
const PROTOCOL_PATTERNS = [
  /hello|welcome|good\s*(morning|afternoon|evening)|namaste|hi\b/i,
  /help|assist|what\s*(can|may)\s*i\s*do|how\s*can/i,
  /mobile\s*number|phone\s*number|registered\s*number/i,
  /aadhaar|id\s*card|identity|verification|verify|document/i,
  /sorry|understand|stress|worried|don't\s*worry|no\s*worries|empathize/i,
  /process|procedure|step|block|deactivate|new\s*sim|replacement|issu/i,
  /charge|fee|cost|pay|rupee|₹|\brs\b/i,
  /fir|police|complaint|report|station/i,
  /same\s*number|number\s*(will|shall)\s*(remain|stay|be\s*preserved)|preserve/i,
  /reference|tracking|service\s*id|receipt|hand\s*over|here\s*(is|'s)\s*your/i,
  /2.*4\s*hour|activation|active|activate|within/i,
  /anything\s*else|else\s*(i\s*can|we\s*can)|other\s*(help|assist)/i,
  /thank|pleasure|take\s*care|have\s*a\s*(good|nice)|welcome\s*back/i,
];

export default function RoleplayPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const { sendMessage: sendApiMessage, endSession } = useSession();

  const [messages, setMessages] = useState([]);
  const [interimText, setInterimText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState(new Array(13).fill(false));
  const [seconds, setSeconds] = useState(0);
  const [isEnding, setIsEnding] = useState(false);

  const conversationRef = useRef([]);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const finalTextAccumulator = useRef('');

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Auto-end at 8 minutes
  useEffect(() => {
    if (seconds >= 480) {
      handleEndSession();
    }
  }, [seconds]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const timerColor = seconds >= 360 ? 'bg-amber-500/80' : 'bg-white/20';

  // Check protocol steps against user messages
  const updateChecklist = useCallback((userText) => {
    setCheckedSteps((prev) => {
      const next = [...prev];
      PROTOCOL_PATTERNS.forEach((pattern, i) => {
        if (!next[i] && pattern.test(userText)) {
          next[i] = true;
        }
      });
      return next;
    });
  }, []);

  // Unlock audio on first user interaction (required for mobile)
  const audioUnlockedRef = useRef(false);
  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    // Play a silent audio to unlock mobile audio playback
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      ctx.resume();
      console.log('Audio unlocked for mobile playback');
    } catch (e) {
      console.log('Audio unlock attempt:', e.message);
    }
  }, []);

  // Play TTS audio
  const playAudio = useCallback((base64, text) => {
    console.log('playAudio called, hasBase64:', !!base64, 'base64Length:', base64?.length || 0);
    if (base64) {
      try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audioRef.current = audio;
        setIsSpeaking(true);

        audio.onended = () => {
          console.log('Audio playback ended');
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          audioRef.current = null;
        };
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          audioRef.current = null;
          fallbackSpeak(text);
        };
        audio.play().then(() => {
          console.log('Audio playing successfully');
        }).catch((err) => {
          console.error('Audio play failed:', err.message);
          fallbackSpeak(text);
        });
      } catch (e) {
        console.error('Audio decode error:', e.message);
        fallbackSpeak(text);
      }
    } else {
      console.log('No audio base64, using fallback TTS');
      fallbackSpeak(text);
    }
  }, []);

  const fallbackSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 0.95;
      // Try to find an Indian English voice
      const voices = speechSynthesis.getVoices();
      const indianVoice = voices.find((v) => v.lang.includes('en-IN'));
      if (indianVoice) utterance.voice = indianVoice;

      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  // Handle sending a completed user message to Claude
  const processUserMessage = useCallback(async (text) => {
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);

    // Add user message
    const userMsg = { speaker: 'You', text, isFinal: true };
    setMessages((prev) => [...prev, userMsg]);
    conversationRef.current.push(userMsg);
    updateChecklist(text);

    try {
      const data = await sendApiMessage(sessionId, text, conversationRef.current);

      // Add Rahul's response
      const rahulMsg = { speaker: 'Rahul', text: data.response, isFinal: true };
      setMessages((prev) => [...prev, rahulMsg]);
      conversationRef.current.push(rahulMsg);

      // Play audio
      playAudio(data.audio_base64, data.response);

      // Check if session should end
      if (data.should_end) {
        setTimeout(() => handleEndSession(), 3000);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMsg = { speaker: 'Rahul', text: "I'm sorry, could you repeat that? I didn't quite catch it.", isFinal: true };
      setMessages((prev) => [...prev, errorMsg]);
      conversationRef.current.push(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, isProcessing, sendApiMessage, updateChecklist, playAudio]);

  // WebSocket message handler (STT transcripts)
  const handleWsMessage = useCallback((data) => {
    if (data.type === 'interim') {
      setInterimText(data.transcript);
    } else if (data.type === 'final') {
      setInterimText('');
      // Accumulate final text segments
      finalTextAccumulator.current += (finalTextAccumulator.current ? ' ' : '') + data.transcript;
    }
  }, []);

  const { sendMessage: wsSend, sendBinary, isConnected } = useWebSocket(handleWsMessage);
  const { startRecording, stopRecording, isRecording } = useAudio(wsSend, sendBinary);

  // When recording stops, wait briefly for final Deepgram transcript then process
  const handleMicRelease = useCallback(() => {
    stopRecording();
    setInterimText('');

    // Wait 800ms for the final Deepgram transcript to arrive via WebSocket
    // (there's a small delay between stop_stream and the final result)
    setTimeout(() => {
      const text = finalTextAccumulator.current.trim();
      finalTextAccumulator.current = '';
      if (text) {
        processUserMessage(text);
      }
    }, 800);
  }, [stopRecording, processUserMessage]);

  const handleMicPress = useCallback(() => {
    if (isSpeaking || isProcessing) return;
    unlockAudio(); // Unlock mobile audio on first mic press
    finalTextAccumulator.current = '';
    startRecording();
  }, [isSpeaking, isProcessing, startRecording, unlockAudio]);

  // End session
  const handleEndSession = useCallback(async () => {
    if (isEnding) return;
    setIsEnding(true);
    clearInterval(timerRef.current);

    // Stop any ongoing recording
    if (isRecording) stopRecording();

    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speechSynthesis?.cancel();

    try {
      const scores = await endSession(sessionId, conversationRef.current, seconds);
      navigate(`/score?session=${sessionId}`, { state: { scores, transcript: conversationRef.current } });
    } catch (err) {
      console.error('Error ending session:', err);
      navigate(`/score?session=${sessionId}`, { state: { transcript: conversationRef.current } });
    }
  }, [isEnding, isRecording, stopRecording, endSession, sessionId, seconds, navigate]);

  const micDisabled = isSpeaking || isProcessing || isEnding;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Scene banner */}
      <div className="bg-primary text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="font-semibold text-sm md:text-base">ConnectIndia Telecom — Service Counter</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-mono text-sm ${timerColor} px-3 py-1 rounded-full transition-colors`}>
            {formatTime(seconds)}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Left: Avatars + Transcript + Controls */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Avatar cards */}
          <div className="flex justify-center gap-8 md:gap-16 py-4">
            <AvatarCard
              name="Rahul Mehta"
              role="Customer (AI)"
              initials="RM"
              color="purple"
              isSpeaking={isSpeaking}
            />
            <AvatarCard
              name="You"
              role="Store Executive"
              color="teal"
              isUser
              isSpeaking={isRecording}
            />
          </div>

          {/* Transcript */}
          <TranscriptPanel messages={messages} interimText={interimText} />

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 py-4 md:pb-4 pb-24">
            {/* Mic button */}
            <button
              onMouseDown={handleMicPress}
              onMouseUp={handleMicRelease}
              onTouchStart={(e) => { e.preventDefault(); handleMicPress(); }}
              onTouchEnd={(e) => { e.preventDefault(); handleMicRelease(); }}
              disabled={micDisabled}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center
                transition-all duration-200 shadow-lg active:scale-95
                ${micDisabled
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isRecording
                    ? 'bg-secondary text-white scale-110 shadow-secondary/40'
                    : 'bg-white text-text-secondary hover:bg-gray-50 border-2 border-gray-200'
                }`}
            >
              <svg className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>

            {/* End session button */}
            <button
              onClick={handleEndSession}
              disabled={isEnding}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-full
                transition-all duration-200 shadow-md text-sm disabled:opacity-60"
            >
              {isEnding ? 'Scoring...' : 'Complete & Score'}
            </button>
          </div>

          {/* Mic hint */}
          <p className="text-center text-text-secondary text-xs -mt-2 pb-2">
            {isEnding
              ? 'Generating your assessment scores...'
              : isProcessing
                ? 'Rahul is thinking...'
                : isSpeaking
                  ? 'Rahul is speaking...'
                  : isRecording
                    ? 'Listening... release to send'
                    : 'Hold the mic button to speak'}
          </p>
        </div>

        {/* Right: Protocol checklist (desktop) */}
        <div className="hidden md:block w-72 flex-shrink-0">
          <ProtocolChecklist checkedSteps={checkedSteps} />
        </div>
      </div>

      {/* Mobile checklist */}
      <div className="md:hidden">
        <ProtocolChecklist checkedSteps={checkedSteps} />
      </div>
    </div>
  );
}
