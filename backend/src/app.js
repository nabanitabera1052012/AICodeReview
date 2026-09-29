const express = require('express');
const aiRoutes = require("./routes/ai.routes")
const cors = require('cors')

const app = express()

// Secure Allowed Origins from .env and development environments
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://ai-code-review-frontend-six.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (e.g. server-to-server health checks, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error(`CORS blocked: Origin ${origin} is not allowed.`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());


app.get('/', (req, res) => {
  res.send('AI Code Reviewer Backend is Running!');
});

app.use('/ai', aiRoutes);

// Error handler for CORS security and general exceptions
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;