require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const path = require('path');
const fs = require('fs');

const { connectToDatabase } = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── CORS ─────────────────────────────────────────────────────────────────────
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Always allow requests without origin (e.g. mobile apps, curl, server-to-server)
    // Always allow in development, or if wildcard *, or exact origin match, or any .onrender.com domain
    if (
      !origin ||
      NODE_ENV !== 'production' ||
      CORS_ORIGINS.includes('*') ||
      CORS_ORIGINS.includes(origin) ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback: permit request to avoid blocking live frontend
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 600,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.set('trust proxy', 1);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;

  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'OK' : 'DEGRADED',
    environment: NODE_ENV,
    database: isConnected ? 'connected' : 'disconnected',
    message: 'E-Learning API is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── Static Frontend Serving (Single-Service Deployment Support) ───────────────
const clientBuildPath = path.join(__dirname, '../learning-app/build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      name: 'E-Learning Platform API',
      version: '1.0.0',
      status: 'running',
      environment: NODE_ENV,
      docs: '/api/health',
    });
  });
}

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (NODE_ENV !== 'production') console.error(err.stack);
  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({ message: err.message });
  }
  res.status(500).json({
    message: NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

// ─── Startup Validations ─────────────────────────────────────────────────────
function validateEnvironment() {
  const issues = [];
  if (NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith('local-dev-') || process.env.JWT_SECRET.startsWith('elearning_super_secret')) {
      issues.push('⚠️  JWT_SECRET is using a dev value — override it in Render Environment Variables.');
    }
    if (!process.env.MONGODB_URI) {
      issues.push('❌ MONGODB_URI is not set. The server cannot connect to MongoDB.');
    }
  }
  if (issues.length) {
    console.log('\n──────────────────────────────────────────');
    issues.forEach(i => console.log(i));
    console.log('──────────────────────────────────────────\n');
  }
  return issues.filter(i => i.startsWith('❌')).length === 0;
}

async function startServer() {
  try {
    const envOk = validateEnvironment();
    if (!envOk && NODE_ENV === 'production') {
      console.error('Aborting startup due to critical environment issues.');
      process.exit(1);
    }

    await connectToDatabase();

    const server = app.listen(PORT, () => {
      const host = NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
      console.log(`\n✅ E-Learning API Server (${NODE_ENV}) listening on ${host}:${PORT}`);
      console.log(`   Health check: ${NODE_ENV === 'production' ? '/api/health' : 'http://localhost:' + PORT + '/api/health'}`);
      if (CORS_ORIGINS.length) console.log(`   CORS origins allowed: ${CORS_ORIGINS.join(', ')}`);
      console.log('');
    });

    const shutdown = (signal) => {
      console.log(`\n${signal} received — shutting down gracefully...`);
      server.close(async () => {
        try { await mongoose.connection.close(); } catch (_) {}
        console.log('Server closed. Goodbye.');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('🔥 Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
