const fs = require('fs');
const path = require('path');

let client = null;
let initialized = false;

function getClient() {
  if (initialized) return client;
  initialized = true;

  try {
    const textToSpeech = require('@google-cloud/text-to-speech');

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      client = new textToSpeech.TextToSpeechClient({ credentials });
      console.log('Google TTS initialized from env var credentials');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const credPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      if (fs.existsSync(credPath)) {
        const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
        client = new textToSpeech.TextToSpeechClient({ credentials });
        console.log('Google TTS initialized from credentials file:', credPath);
      } else {
        console.warn('Google TTS credentials file not found:', credPath);
      }
    } else {
      console.warn('Google TTS not configured — audio will not be generated');
    }
  } catch (err) {
    console.warn('Google TTS setup error:', err.message);
  }

  return client;
}

async function synthesizeRahulVoice(text) {
  const cl = getClient();
  if (!cl) return null;

  try {
    const request = {
      input: { text },
      voice: {
        languageCode: 'en-IN',
        name: 'en-IN-Standard-B',
        ssmlGender: 'MALE',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.95,
        pitch: -1.0,
      },
    };

    const [response] = await cl.synthesizeSpeech(request);
    return response.audioContent.toString('base64');
  } catch (err) {
    console.error('Google TTS synthesis error:', err.message);
    return null;
  }
}

module.exports = { synthesizeRahulVoice };
