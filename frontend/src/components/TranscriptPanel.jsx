import { useEffect, useRef } from 'react';

export default function TranscriptPanel({ messages = [], interimText = '' }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, interimText]);

  return (
    <div
      ref={scrollRef}
      className="transcript-scroll bg-white rounded-2xl shadow-sm border border-gray-100 overflow-y-auto"
      style={{ maxHeight: '300px' }}
    >
      {messages.length === 0 && !interimText && (
        <div className="p-6 text-center text-text-secondary text-sm">
          Conversation will appear here...
        </div>
      )}

      {messages.map((msg, i) => (
        <div
          key={i}
          className={`px-4 py-3 border-b border-gray-50 ${i % 2 === 0 ? 'bg-background' : 'bg-white'}`}
        >
          <span
            className={`font-semibold text-sm ${
              msg.speaker === 'Rahul' ? 'text-customer' : 'text-secondary'
            }`}
          >
            {msg.speaker === 'Rahul' ? 'Rahul:' : 'You:'}
          </span>
          <span className={`ml-2 text-sm ${msg.isFinal === false ? 'text-gray-400 italic' : 'text-text-primary'}`}>
            {msg.text}
          </span>
        </div>
      ))}

      {interimText && (
        <div className="px-4 py-3 bg-white">
          <span className="font-semibold text-sm text-secondary">You:</span>
          <span className="ml-2 text-sm text-gray-400 italic">{interimText}</span>
        </div>
      )}
    </div>
  );
}
