//backend/tournament-service/src/server.ts
import fastify from 'fastify';
import cookie from '@fastify/cookie';

import playerRoutes from './routes/player.routes.js';
import { connectToDatabase } from './plugins/sqlite.js';

import { PORT } from './config/env.js';

const app = fastify({ /*logger: true*/ });

app.register(cookie);
app.register(playerRoutes, { prefix: '/api/v1/player' });
app.get('/', async (_req, reply) => {
    return reply.send({ message: 'Welcome to Tournament API' });
});

const start = async () => {
    try {
        await connectToDatabase();

        const port = parseInt(PORT ?? '3003', 10);
        await app.listen({ port, host: '0.0.0.0' });
        app.log.info(`Tournament API is running on http://localhost:${port}`);
    } catch (err) {
        app.log.error(err, 'Failed to start Tournament API:', err);
        process.exit(1);
    }
};

start();
export default app; 
