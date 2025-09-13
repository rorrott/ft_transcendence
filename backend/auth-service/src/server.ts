// backend/auth-service/src/server.ts
import fastify from 'fastify';
import cookie from '@fastify/cookie';
import authRoutes from './routes/auth.routes.js';
import verifyTokenRoute from './routes/verifyToken.route.js';
import { connectToDatabase } from './plugins/sqlite.js';

import { PORT } from './config/env.js';

const app = fastify({ /*logger: true*/ });
app.register(cookie);
app.register(authRoutes, { prefix: '/api/v1/auth' });
app.register(verifyTokenRoute, { prefix: '/api/v1/auth' });
app.get('/', async (_req, reply) => {
    return reply.send({ message: 'Welcome to Authentication API' });
});

const start = async () => {
    try {
        connectToDatabase();
        const port = parseInt(PORT ?? '3000', 10);
        await app.listen({ port, host: '0.0.0.0' });
        app.log.info(`Auth API is running on http://localhost:${port}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
export default app;
