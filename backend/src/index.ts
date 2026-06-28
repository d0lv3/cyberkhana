import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser'; // Import cookie-parser
import { basename } from 'path';
import { connectDatabase } from './config/database';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from './middleware/auth';
import { initializeSocket } from './services/socketService';
import { requestLogger } from './middleware/requestLogger';
import { logger } from './utils/logger';

import authRoutes from './routes/auth';
import challengeRoutes from './routes/challenges';
import competitionRoutes from './routes/competitions';
import userRoutes from './routes/users';
import universityRoutes from './routes/universities';
import announcementRoutes from './routes/announcements';
import activityRoutes from './routes/activity';

dotenv.config();

const app = express();

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/$/, '');

const expandLocalOriginAliases = (origin: string) => {
  const normalized = normalizeOrigin(origin);
  const aliases = new Set([normalized]);

  if (normalized.includes('localhost')) {
    aliases.add(normalized.replace('localhost', '127.0.0.1'));
  }

  if (normalized.includes('127.0.0.1')) {
    aliases.add(normalized.replace('127.0.0.1', 'localhost'));
  }

  return Array.from(aliases);
};

const allowedSocketOrigins = Array.from(new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://164.92.186.62',
  'https://cyberkhana.tech',
  'https://www.cyberkhana.tech',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim()) : [])
]
  .filter(Boolean)
  .flatMap(expandLocalOriginAliases)
  .map(normalizeOrigin)));

// Create HTTP server for Socket.IO
const httpServer = createServer(app);

// Initialize Socket.IO with CORS
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedSocketOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by Socket.IO CORS'));
    },
    credentials: true
  },
  path: '/socket.io/'
});

// Make io instance available for controllers
export { io };

// Initialize socket service
initializeSocket(io);

// Authentication middleware for Socket.IO
io.use(async (socket: any, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.cookie;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    const decoded = await verifyToken(token);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Handle connections
io.on('connection', (socket: any) => {
  const userId = socket.user.userId;
  const universityCode = socket.user.universityCode;

  // Join university-specific room
  socket.join(`university:${universityCode}`);

  // Join user's personal room for direct messages
  socket.join(`user:${userId}`);

  logger.info('socket.user.connected', { userId, universityCode });

  socket.on('joinCompetition', (data: { competitionId: string }) => {
    socket.join(`competition:${data.competitionId}`);
    logger.info('socket.user.join_competition', { userId, competitionId: data.competitionId });
  });

  socket.on('leaveCompetition', (data: { competitionId: string }) => {
    socket.leave(`competition:${data.competitionId}`);
    logger.info('socket.user.leave_competition', { userId, competitionId: data.competitionId });
  });

  socket.on('disconnect', () => {
    logger.info('socket.user.disconnected', { userId });
  });
});

// BROKEN RATE LIMIT: Keep this for user registrations as requested
// No rate limiting on authentication to allow unlimited user registrations
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 999999, // Very high limit for unlimited access
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// STRICT RATE LIMIT: Protect login from brute force
const strictLoginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit each IP to 20 login requests per windowMs
  message: { error: 'Too many login attempts, please try again later after 10 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cookieParser()); // Use cookie-parser

// Security: CORS configuration - Allow all origins for CTF platform
const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    // and allow all origins for the CTF platform
    callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);

// Use __dirname for reliable path resolution regardless of where the process starts
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Dedicated download route that forces downloads
app.get('/api/download/*', (req, res) => {
  const filename = (req.params as any)[0];
  // Fix Path Traversal: Sanitize filename
  const safeFilename = path.basename(filename);
  const filePath = path.join(uploadsDir, safeFilename);

  // Verify the file exists and is within the uploads directory (extra safety)
  if (!filePath.startsWith(uploadsDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.download(filePath, safeFilename, (err) => {
    if (err) {
      logger.error('file.download.failed', { safeFilename, error: err });
      if (!res.headersSent) {
        res.status(404).json({ error: 'File not found' });
      }
    }
  });
});

// Configure file serving for downloads (both /api/uploads and /api/download work)
app.use('/api/uploads', express.static(uploadsDir, {
  setHeaders: (res) => {
    // Force download instead of viewing in browser
    res.setHeader('Content-Disposition', 'attachment');
  }
}));

// Apply strict rate limiting to LOGIN routes (Brute force protection)
app.use('/api/auth/login', strictLoginLimiter);
app.use('/api/auth/login-admin', strictLoginLimiter);
app.use('/api/auth/login-super-admin', strictLoginLimiter);
app.use('/api/auth/super-admin/password', strictLoginLimiter);

// Apply BROKEN rate limiting (unlimited) to REGISTER route
app.use('/api/auth/register', authLimiter);

// Other routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/activity', activityRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CyberKhana API is running' });
});

const PORT = process.env.PORT || 5001;

connectDatabase().then(() => {
  httpServer.listen(PORT, () => {
    logger.info('server.started', {
      port: PORT,
      mode: process.env.NODE_ENV || 'development',
      websocket: true,
    });
  });
});
