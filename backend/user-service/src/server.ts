// backend/user-service/src/server.ts
//import fastify from 'fastify';
import { fastify, FastifyRequest, FastifyReply } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';

import http from 'http';
import { Server, Socket } from 'socket.io';

import userRoutes from './routes/user.routes.js';
import { connectToUserDatabase } from './plugins/sqlite.js';
import { PORT } from './config/env.js';
import { User } from './models/user.models.js';

const app = fastify();
const server = http.createServer(app.server);

// Enable CORS for frontend communication
await app.register(cors, {
  //origin: ['https://localhost:8443'],
  origin: ['*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Register necessary plugins
app.register(cookie);
app.register(fastifyMultipart, {
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB file limit
});

// Register user routes
app.register(userRoutes, { prefix: '/api/v1/user' });

// Health check
app.get('/', async (req: FastifyRequest, reply : FastifyReply) => {
  return reply.send({ message: 'Welcome to User API' });
});

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust in production
    methods: ['GET', 'POST']
  }
});

// WebSocket user connection management
io.on('connection', async (socket: Socket) => {
  const userId = Number(socket.handshake.query.userId);
  if (isNaN(userId)) {
    console.log('Invalid or missing userId in socket connection query');
    socket.disconnect(true);
    return;
  }

  try {
    const updatedOnline = await User.update(userId, { onlineStatus: true });
    if (updatedOnline) {
      console.log(`User ${userId} is now online`);
      socket.broadcast.emit('userOnline', { userId });
    } else {
      console.log(`User ${userId} could not be marked online.`);
    }
  } catch (error) {
    console.error(`Error setting user ${userId} online:`, error);
  }

  socket.on('disconnect', async () => {
    try {
      const updatedOffline = await User.update(userId, { onlineStatus: false });
      if (updatedOffline) {
        console.log(`User ${userId} went offline`);
        socket.broadcast.emit('userOffline', { userId });
      } else {
        console.log(`User ${userId} could not be marked offline.`);
      }
    } catch (error) {
      console.error(`Error setting user ${userId} offline:`, error);
    }
  });
});

// Start the servers
const start = async () => {
  try {
    await connectToUserDatabase();
    const port = parseInt(PORT ?? '3001', 10);

    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`User API (HTTP) is running on http://localhost:${port}`);

    server.listen(5502, () => {
      console.log('Socket.IO server (WebSocket) is running on http://localhost:5502');
    });
  } catch (err) {
    app.log.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

export default app;
