//backend/tournament-service/src/routes/player.routes.ts
import { authorize } from '../middleware/auth.middleware.js';
import { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { createCasualMatch, submitCasualMatchResult } from '../controllers/tournament.controller.js';
import { createTournament, joinTournament, startTournament, getTournamentBracket,
         submitTournamentResult } from '../controllers/tournament.controller.js';

export default async function playerRoutes(fastify: FastifyInstance) {
	// Casual Match routes
  	fastify.post('/matches/challenge', { preHandler: authorize }, createCasualMatch);
  	fastify.post('/matches/:id/result', { preHandler: authorize }, submitCasualMatchResult);
  	// Tournament routes
  	fastify.post('/tournament', { preHandler: authorize }, createTournament);
  	fastify.post('/tournament/:id/join', { preHandler: authorize }, joinTournament);
  	fastify.post('/tournament/:id/start', { preHandler: authorize }, startTournament);
  	fastify.get('/tournament/:id/bracket', { preHandler: authorize }, getTournamentBracket);
  	fastify.post('/tournament/matches/:matchId/result', { preHandler: authorize }, submitTournamentResult);
}


// backend/tournament-service/src/routes/player.routes.ts
/*import { authorize } from '../middleware/auth.middleware.js';
import { FastifyInstance, preHandlerHookHandler } from 'fastify';
import {
    createCasualMatch,
    submitCasualMatchResult,
    createTournament,
    joinTournament,
    startTournament,
    getTournamentBracket,
    submitTournamentResult
} from '../controllers/tournament.controller.js';

// --- JSON Schema Definitions for Request Bodies ---

// Schema for POST /api/v1/player/matches/challenge
const createCasualMatchBodySchema = {
    type: 'object',
    required: ['player1_id', 'player2_id'],
    properties: {
        player1_id: { type: 'number', description: 'ID of the first player' },
        player2_id: { type: 'number', description: 'ID of the second player' },
        tournament_id: { type: 'number', nullable: true, description: 'Optional tournament ID if part of a tournament' }
    },
    // This is crucial: it rejects any properties not explicitly defined above.
    // This prevents unexpected fields (like the 'score' field you had before)
    // from causing a Bad Request.
    additionalProperties: false
};

// Schema for POST /api/v1/player/tournament
const createTournamentBodySchema = {
    type: 'object',
    required: ['name'], // Assuming 'name' is a required field for tournament creation
    properties: {
        name: { type: 'string', description: 'Name of the tournament' },
        players: {
            type: 'array',
            items: { type: 'number' },
            nullable: true,
            description: 'Optional list of player IDs to pre-register for the tournament'
        }
    },
    additionalProperties: false
};

// Schema for POST /api/v1/player/matches/:id/result
const submitCasualMatchResultBodySchema = {
    type: 'object',
    required: ['winner_id', 'score'],
    properties: {
        winner_id: { type: 'number', description: 'ID of the winning player' },
        score: { type: 'string', description: 'Match score in "X-Y" format' }
    },
    additionalProperties: false
};

// Schema for POST /api/v1/player/tournament/:id/join
const joinTournamentBodySchema = {
    type: 'object',
    required: ['player_id'],
    properties: {
        player_id: { type: 'number', description: 'ID of the player joining the tournament' }
    },
    additionalProperties: false
};

// Schema for POST /api/v1/player/tournament/matches/:matchId/result
const submitTournamentMatchResultBodySchema = {
    type: 'object',
    required: ['winner_id', 'score'],
    properties: {
        winner_id: { type: 'number', description: 'ID of the winning player' },
        score: { type: 'string', description: 'Match score in "X-Y" format' }
    },
    additionalProperties: false
};


// --- Route Definitions ---
export default async function playerRoutes(fastify: FastifyInstance) {
    // Casual Match routes
    fastify.post('/matches/challenge', {
        preHandler: authorize,
        schema: {
            body: createCasualMatchBodySchema // Attach the schema here
        }
    }, createCasualMatch);

    fastify.post('/matches/:id/result', {
        preHandler: authorize,
        schema: {
            body: submitCasualMatchResultBodySchema // Attach the schema here
        }
    }, submitCasualMatchResult);

    // Tournament routes
    fastify.post('/tournament', {
        preHandler: authorize,
        schema: {
            body: createTournamentBodySchema // Attach the schema here
        }
    }, createTournament);

    fastify.post('/tournament/:id/join', {
        preHandler: authorize,
        schema: {
            body: joinTournamentBodySchema // Attach the schema here
        }
    }, joinTournament);

    fastify.post('/tournament/:id/start', { preHandler: authorize }, startTournament);
    fastify.get('/tournament/:id/bracket', { preHandler: authorize }, getTournamentBracket);

    fastify.post('/tournament/matches/:matchId/result', {
        preHandler: authorize,
        schema: {
            body: submitTournamentMatchResultBodySchema // Attach the schema here
        }
    }, submitTournamentResult);
}*/
