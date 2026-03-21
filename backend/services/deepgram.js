const { createClient, LiveTranscriptionEvents } = require('@deepgram/sdk');

let dgInitialized = false;

function logConfig() {
  if (dgInitialized) return;
  dgInitialized = true;
  if (process.env.DEEPGRAM_API_KEY) {
    console.log('Deepgram API key configured');
  } else {
    console.warn('DEEPGRAM_API_KEY not set — real-time STT disabled');
  }
}

function createDeepgramConnection(sampleRate, onTranscript) {
  logConfig();

  if (!process.env.DEEPGRAM_API_KEY) {
    return {
      send: () => {},
      close: () => {},
    };
  }

  const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

  let isOpen = false;
  let audioBuffer = [];
  let chunkCount = 0;

  const connection = deepgram.listen.live({
    model: 'nova-2',
    language: 'en-IN',
    smart_format: true,
    interim_results: true,
    encoding: 'linear16',
    sample_rate: sampleRate,
    channels: 1,
  });

  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log('Deepgram connection opened');
    isOpen = true;
    // Flush any buffered audio
    if (audioBuffer.length > 0) {
      console.log(`Flushing ${audioBuffer.length} buffered audio chunks`);
      audioBuffer.forEach((chunk) => {
        try { connection.send(chunk); } catch (e) { /* ignore */ }
      });
      audioBuffer = [];
    }
  });

  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    console.log('Raw Deepgram event:', JSON.stringify(data).substring(0, 300));
    const transcript = data.channel?.alternatives?.[0]?.transcript;
    if (!transcript) return;

    const isFinal = data.is_final;
    console.log(`Deepgram ${isFinal ? 'FINAL' : 'interim'}: "${transcript}"`);
    onTranscript({
      type: isFinal ? 'final' : 'interim',
      transcript,
    });
  });

  connection.on(LiveTranscriptionEvents.Error, (err) => {
    console.error('Deepgram error:', err);
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log('Deepgram connection closed');
    isOpen = false;
  });

  // Catch ANY event for debugging
  connection.on(LiveTranscriptionEvents.Metadata, (data) => {
    console.log('Deepgram metadata:', JSON.stringify(data).substring(0, 200));
  });

  return {
    send: (audioData) => {
      chunkCount++;
      // Ensure data is a Buffer (Deepgram SDK v3 expects Buffer)
      const buffer = Buffer.isBuffer(audioData) ? audioData : Buffer.from(audioData);
      if (chunkCount % 20 === 1) {
        console.log(`Audio chunk #${chunkCount}, size: ${buffer.length} bytes, isOpen: ${isOpen}`);
      }
      if (!isOpen) {
        audioBuffer.push(buffer);
        return;
      }
      try {
        connection.send(buffer);
      } catch (e) {
        console.error('Error sending to Deepgram:', e.message);
      }
    },
    close: () => {
      try {
        connection.finish();
      } catch (e) {
        // Connection may already be closed
      }
    },
  };
}

module.exports = { createDeepgramConnection };
