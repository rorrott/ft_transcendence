// backend/tournament-service/src/routes/tournament.routes.ts
/*import { FastifyInstance } from 'fastify';
import { authorize } from '../middleware/auth.middleware.js'; // Ensure correct path
import {
    createTournament,
    joinTournament,
    startTournament,
    getTournamentBracket,
    submitTournamentResult
} from '../controllers/tournament.controller.js'; // Adjust controller import if tournament gets its own controller

export default async function tournamentRoutes(fastify: FastifyInstance) {
    // These routes will be prefixed with /api/v1/tournament from server.ts
    fastify.post('/', { preHandler: authorize }, createTournament);
    fastify.post('/:id/join', { preHandler: authorize }, joinTournament);
    fastify.post('/:id/start', { preHandler: authorize }, startTournament);
    fastify.get('/:id/bracket', { preHandler: authorize }, getTournamentBracket);
    fastify.post('/matches/:matchId/result', { preHandler: authorize }, submitTournamentResult);
}*/