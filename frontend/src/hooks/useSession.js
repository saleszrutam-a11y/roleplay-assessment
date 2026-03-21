import { useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

async function apiFetch(path, options = {}) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export default function useSession() {
  const startSession = useCallback(async () => {
    return apiFetch('/api/session/start', { method: 'POST' });
  }, []);

  const sendMessage = useCallback(async (sessionId, message, conversationHistory) => {
    return apiFetch('/api/session/message', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        message,
        conversation_history: conversationHistory,
      }),
    });
  }, []);

  const endSession = useCallback(async (sessionId, transcript, durationSeconds) => {
    return apiFetch('/api/session/end', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        transcript,
        duration_seconds: durationSeconds,
      }),
    });
  }, []);

  const getResult = useCallback(async (sessionId) => {
    return apiFetch(`/api/session/${sessionId}/result`);
  }, []);

  return { startSession, sendMessage, endSession, getResult };
}
