require('dotenv').config({ override: true });
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const sessionRoutes = require('./routes/session');
const { createDeepgramConnection } = require('./services/deepgram');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    // Allow localhost, LAN IPs, and Netlify deployments
    if (
      origin.includes('localhost') ||
      origin.match(/^https?:\/\/192\.168\./) ||
      origin.includes('.netlify.app')
    ) {
      return callback(null, true);
    }
    const allowed = process.env.FRONTEND_URL || 'http://localhost:5173';
    if (origin === allowed) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/session', sessionRoutes);

// WebSocket handler — Deepgram STT pipeline
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  let dgConnection = null;

  ws.on('message', (data, isBinary) => {
    // Try to parse as JSON first (some proxies mark text as binary)
    const str = data.toString();
    let parsed = null;
    if (str.length < 500) {
      try { parsed = JSON.parse(str); } catch (e) { /* not JSON */ }
    }

    if (parsed && parsed.type) {
      // Control message
      if (parsed.type === 'start_stream') {
        const sampleRate = parsed.sampleRate || 16000;
        console.log(`Starting Deepgram stream (sample rate: ${sampleRate})`);
        dgConnection = createDeepgramConnection(sampleRate, (transcript) => {
          console.log('Deepgram transcript:', JSON.stringify(transcript));
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(transcript));
            console.log('Sent transcript to client');
          }
        });
      } else if (parsed.type === 'stop_stream') {
        console.log('Stopping Deepgram stream');
        if (dgConnection) {
          dgConnection.close();
          dgConnection = null;
        }
      }
    } else if (isBinary || data.length > 500) {
      // Binary data — audio chunks, forward to Deepgram
      if (dgConnection) {
        dgConnection.send(data);
      }
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    if (dgConnection) {
      dgConnection.close();
      dgConnection = null;
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    if (dgConnection) {
      dgConnection.close();
      dgConnection = null;
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
