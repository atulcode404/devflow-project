import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import ConnectionRequest from './models/ConnectionRequest.js';

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

// Parse allowed origins from CLIENT_URL (supports comma-separated list)
const getAllowedOrigins = () => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return clientUrl.split(',').map(u => u.trim());
};

const allowedOrigins = [
  "https://devflow-project-b978.vercel.app",
  "https://devflow-project-liard.vercel.app",
  ...getAllowedOrigins()
];

// Express middleware
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());
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
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Increase timeouts for Render free-tier cold starts
  pingTimeout: 60000,
  pingInterval: 25000,
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

// Active calls tracking: Map<userId, roomId>
const activeCalls = new Map();
// Active users tracking: Map<userId, Set<socketId>> (to handle multiple tabs)
const activeUsers = new Map();
// Rate limit for calls: Map<userId, timestamp>
const callRateLimits = new Map();

// Attach these to global for Admin analytics
global.activeCallsMap = activeCalls;
global.totalVideoCalls = 0;
global.totalVoiceCalls = 0;
global.failedCalls = 0;

// Periodic cleanup of rate limits to prevent memory leaks for inactive users
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamp] of callRateLimits.entries()) {
    if (now - timestamp > 60000) { // Keep only for 1 minute
      callRateLimits.delete(userId);
    }
  }
}, 60000);

// Socket connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id, 'User ID:', socket.userId);
  
  if (socket.userId) {
    socket.join(socket.userId);
    
    // Add socket to the user's active connections
    if (!activeUsers.has(socket.userId)) {
      activeUsers.set(socket.userId, new Set());
      // Broadcast to everyone that this user is online (first connection)
      io.emit('user-online', { userId: socket.userId });
    }
    activeUsers.get(socket.userId).add(socket.id);
    
    console.log(`User ${socket.userId} joined room. Active sessions:`, activeUsers.get(socket.userId).size);
    
    // Send the list of active users to the newly connected user
    socket.emit('active-users', Array.from(activeUsers.keys()));
  }

  // Handle Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id, 'User ID:', socket.userId);
    if (socket.userId && activeUsers.has(socket.userId)) {
      const userSockets = activeUsers.get(socket.userId);
      userSockets.delete(socket.id);
      
      // If user has no more active tabs, they are truly offline
      if (userSockets.size === 0) {
        activeUsers.delete(socket.userId);
        activeCalls.delete(socket.userId);
        callRateLimits.delete(socket.userId);
        io.emit('user-offline', { userId: socket.userId });
        console.log(`User ${socket.userId} is fully offline`);
      }
    }
  });

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
  socket.on('call-user', async ({ targetUserId, offer, callerInfo, isVoiceOnly, roomId }) => {
    // 0. Rate Limiting (1 call per 5 seconds max per user)
    const now = Date.now();
    const lastCallTime = callRateLimits.get(socket.userId) || 0;
    if (now - lastCallTime < 5000) {
      global.failedCalls++;
      socket.emit('call-failed', { message: 'Please wait before making another call.' });
      return;
    }
    callRateLimits.set(socket.userId, now);

    // 1. Check if target is in a call
    if (activeCalls.has(targetUserId)) {
      global.failedCalls++;
      socket.emit('call-busy', { busyUser: targetUserId });
      return;
    }

    // 2. Validate they are connected
    try {
      const isConnected = await ConnectionRequest.findOne({
        $or: [
          { sender: socket.userId, receiver: targetUserId },
          { sender: targetUserId, receiver: socket.userId }
        ],
        status: 'accepted'
      });

      if (!isConnected) {
        global.failedCalls++;
        socket.emit('call-failed', { message: 'You can only call connected developers.' });
        return;
      }

      // Relay call
      socket.to(targetUserId).emit('incoming-call', {
        callerId: socket.userId,
        callerInfo,
        offer,
        isVoiceOnly: !!isVoiceOnly,
        roomId
      });
    } catch (err) {
      console.error('Call validation error:', err);
    }
  });

  socket.on('call-ringing', ({ targetUserId }) => {
    socket.to(targetUserId).emit('call-ringing', { ringingBy: socket.userId });
  });

  socket.on('answer-call', ({ targetUserId, answer, roomId, isVoiceOnly }) => {
    // Both users are now actively in this room
    if (roomId) {
      activeCalls.set(socket.userId, roomId);
      activeCalls.set(targetUserId, roomId);
      socket.join(`call:${roomId}`);
      
      // Increment global call counts once answered
      if (isVoiceOnly) global.totalVoiceCalls++;
      else global.totalVideoCalls++;
    }
    
    socket.to(targetUserId).emit('call-answered', { 
      answer, 
      senderId: socket.userId 
    });
  });

  socket.on('reject-call', ({ targetUserId }) => {
    socket.to(targetUserId).emit('call-rejected', { rejectedBy: socket.userId });
  });

  socket.on('peer-offer', ({ targetUserId, offer, callerInfo }) => {
    socket.to(targetUserId).emit('peer-offer', { 
      offer, 
      senderId: socket.userId,
      callerInfo 
    });
  });

  socket.on('peer-answer', ({ targetUserId, answer }) => {
    socket.to(targetUserId).emit('peer-answer', { 
      answer, 
      senderId: socket.userId 
    });
  });

  socket.on('ice-candidate', ({ targetUserId, candidate }) => {
    socket.to(targetUserId).emit('ice-candidate', { 
      candidate,
      senderId: socket.userId
    });
  });

  socket.on('end-call', ({ targetUserId, roomId }) => {
    activeCalls.delete(socket.userId);
    if (targetUserId) activeCalls.delete(targetUserId);
    
    socket.to(targetUserId).emit('call-ended', { endedBy: socket.userId });
  });

  // Additional Call States & Notifications
  socket.on('call-timeout', ({ targetUserId }) => {
    activeCalls.delete(socket.userId);
    socket.to(targetUserId).emit('call-timeout', { timeoutFor: socket.userId });
  });

  socket.on('call-busy', ({ targetUserId }) => {
    socket.to(targetUserId).emit('call-busy', { busyUser: socket.userId });
  });

  socket.on('call-merge-request', async ({ targetUserId, roomId, callerInfo }) => {
    if (activeCalls.has(targetUserId)) {
      socket.emit('call-busy', { busyUser: targetUserId });
      return;
    }
    try {
      const isConnected = await ConnectionRequest.findOne({
        $or: [
          { sender: socket.userId, receiver: targetUserId },
          { sender: targetUserId, receiver: socket.userId }
        ],
        status: 'accepted'
      });
      if (!isConnected) return;
      
      socket.to(targetUserId).emit('call-merge-request', { requester: socket.userId, callerInfo, roomId });
    } catch (err) {
      console.error('Merge validation error:', err);
    }
  });

  socket.on('call-merge-accepted', ({ targetUserId, roomId }) => {
    activeCalls.set(socket.userId, roomId);
    socket.join(`call:${roomId}`);
    
    // Broadcast to everyone in the room that this user joined
    socket.to(`call:${roomId}`).emit('participant-joined', { 
      joinedUserId: socket.userId 
    });
    
    socket.to(targetUserId).emit('call-merge-accepted', { acceptor: socket.userId, roomId });
  });

  socket.on('call-participant-left', ({ roomId }) => {
    activeCalls.delete(socket.userId);
    socket.to(`call:${roomId}`).emit('call-participant-left', { leftBy: socket.userId, roomId });
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

import { execSync } from 'child_process';
try {
  console.log('Attempting to kill ghost process on port ' + PORT + '...');
  execSync(`npx -y kill-port ${PORT}`, { stdio: 'ignore' });
} catch (e) {
  // ignore
}

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
