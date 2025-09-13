// backend/tournament-service/src/routes/casualMatch.routes.ts
/*import { FastifyInstance } from 'fastify';
import { authorize } from '../middleware/auth.middleware.js'; // Ensure correct path
import { createCasualMatch, submitCasualMatchResult } from '../controllers/tournament.controller.js'; // Adjust controller import if casual matches get their own controller

export default async function casualMatchRoutes(fastify: FastifyInstance) {
    // These routes will be prefixed with /api/v1/matches from server.ts
    fastify.post('/challenge', { preHandler: [authorize] }, createCasualMatch);
    fastify.post('/:id/result', { preHandler: authorize }, submitCasualMatchResult);
}*/