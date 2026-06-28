import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import feedRoutes from './routes/feedRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import githubRoutes from './routes/githubRoutes.js';
import postRoutes from './routes/postRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';


// Load environment variables FIRST before anything else
dotenv.config();

// Connect to database (env vars are now available)
connectDB();

const app = express();
const httpServer = createServer(app);

// Express middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Static folder for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Parse cookies helper
const parseCookies = (cookieString) => {
  if (!cookieString) return {};
  return cookieString.split(';').reduce((acc, current) => {
    const parts = current.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      acc[key] = value;
    }
    return acc;
  }, {});
};

// Socket.io setup with JWT authentication middleware
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

import jwt from 'jsonwebtoken';

io.use((socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    const cookies = parseCookies(cookieHeader);
    const token = cookies.jwt;
    if (!token) {
      return next(new Error('Authentication error: No token'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Socket Auth Error:', error.message);
    next(new Error('Authentication error'));
  }
});

// Pass io to request object so controllers can use it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id, 'User ID:', socket.userId);
  
  if (socket.userId) {
    socket.join(socket.userId);
    console.log(`User ${socket.userId} joined room`);
  }

  // Typing indicator events
  socket.on('typing', ({ receiverId }) => {
    socket.to(receiverId).emit('typingStatus', {
      senderId: socket.userId,
      isTyping: true,
    });
  });

  socket.on('stopTyping', ({ receiverId }) => {
    socket.to(receiverId).emit('typingStatus', {
      senderId: socket.userId,
      isTyping: false,
    });
  });

  // ─── WebRTC Video Call Signaling ────────────────────────────────────
  socket.on('call-user', ({ targetUserId, offer, callerInfo }) => {
    socket.to(targetUserId).emit('incoming-call', {
      callerId: socket.userId,
      callerInfo,
      offer,
    });
  });

  socket.on('answer-call', ({ targetUserId, answer }) => {
    socket.to(targetUserId).emit('call-answered', { answer });
  });

  socket.on('reject-call', ({ targetUserId }) => {
    socket.to(targetUserId).emit('call-rejected', { rejectedBy: socket.userId });
  });

  socket.on('ice-candidate', ({ targetUserId, candidate }) => {
    socket.to(targetUserId).emit('ice-candidate', { candidate });
  });

  socket.on('end-call', ({ targetUserId }) => {
    socket.to(targetUserId).emit('call-ended', { endedBy: socket.userId });
  });

  // ─── Pair Programming Room ──────────────────────────────────────────
  socket.on('join-room', ({ roomId }) => {
    socket.join(`room:${roomId}`);
    socket.to(`room:${roomId}`).emit('room-user-joined', { userId: socket.userId });
  });

  socket.on('leave-room', ({ roomId }) => {
    socket.leave(`room:${roomId}`);
    socket.to(`room:${roomId}`).emit('room-user-left', { userId: socket.userId });
  });

  socket.on('code-change', ({ roomId, code }) => {
    socket.to(`room:${roomId}`).emit('code-update', { code, changedBy: socket.userId });
  });

  socket.on('language-change', ({ roomId, language }) => {
    socket.to(`room:${roomId}`).emit('language-update', { language, changedBy: socket.userId });
  });

  socket.on('cursor-update', ({ roomId, cursor }) => {
    socket.to(`room:${roomId}`).emit('cursor-update', { cursor, userId: socket.userId });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});


// Basic route
app.get('/', (req, res) => {
  res.send('DevFlow API is running...');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/recommend', recommendationRoutes);

// Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
