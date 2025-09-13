// backend/tournament-service/src/controllers/tournament.controller.ts
import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { createMatch, submitResult } from '../service/casualMatches.service.js';
import * as svc from '../service/tournaments.service.js';

// Casual match result
export interface CreateCasualMatchRoute extends RouteGenericInterface {
    Body: {
        player1_id: number;
        player2_id: number;
        tournament_id?: number | null;
    };
}
// For /matches/:id/result
interface SubmitCasualMatchResultRoute extends RouteGenericInterface {
    Params: { id: number; };
    Body: { winner_id: number; score: string; };
}
// For /tournament/:id/join
interface JoinTournamentRoute extends RouteGenericInterface {
    Params: { id: number; };
    Body: { player_id: number; };
}
// For /tournament/:id/start and /tournament/:id/bracket
interface TournamentIdParamRoute extends RouteGenericInterface {
    Params: { id: number; };
}
// For /tournament/:matchId/result
interface SubmitTournamentMatchResultRoute extends RouteGenericInterface {
    Params: { matchId: number; };
    Body: { winner_id: number; score: string; };
}

export interface CreateTournamentRoute extends RouteGenericInterface {
    Body: {
        name: string;
        players?: number[];
    };
}

/*export async function createCasualMatch(request: FastifyRequest<CreateCasualMatchRoute>,
reply: FastifyReply) {
    try {
        const match = await createMatch(request.body);
        reply.status(201).send({
            success: true,
            message: 'Casual match created successfully',
            data: match,
        });
    } catch (error) {
        reply.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
}*/

export async function createCasualMatch(
  request: FastifyRequest<CreateCasualMatchRoute>,
  reply: FastifyReply
) {
  try {
    const { player1_id, player2_id } = request.body;

    if (!player1_id || !player2_id) {
      return reply.status(400).send({
        success: false,
        message: 'Both player1_id and player2_id are required.',
      });
    }

    const match = await createMatch(request.body);

    reply.status(201).send({
      success: true,
      message: 'Casual match created successfully',
      data: match,
    });
  } catch (error) {
    console.error('createCasualMatch error:', error);
    reply.status(500).send({
      success: false,
      message: (error as Error).message || 'Internal server error',
    });
  }
}


export async function submitCasualMatchResult(req: FastifyRequest<SubmitCasualMatchResultRoute>,
    reply: FastifyReply) {
    try {
        const result = await submitResult(+req.params.id, req.body);
        reply.status(200).send({
            success: true,
            message: 'Casual match result submitted successfully',
            data: result,
        });
    } catch (error) {
        reply.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
}

export async function createTournament(request: FastifyRequest<CreateTournamentRoute>, reply: FastifyReply) {
    try {
        const tournament = await svc.createTournament(request.body);
        reply.status(201).send({
            success: true,
            message: 'Tournament created successfully',
            data: tournament,
        });
    } catch (error) {
        reply.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
}

export async function joinTournament(req: FastifyRequest<JoinTournamentRoute>,
    reply: FastifyReply) {
    try {
        const result = await svc.joinTournament(+req.params.id, req.body.player_id);
        reply.status(200).send({
            success: true,
            message: 'Joined tournament successfully',
            data: result,
        });
    } catch (error) {
        reply.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
}

export async function startTournament(req: FastifyRequest<TournamentIdParamRoute>,
    reply: FastifyReply) {
    try {
        const result = await svc.startTournament(+req.params.id);
        reply.status(200).send({
            success: true,
            message: 'Tournament started successfully',
            data: result,
        });
    } catch (error) {
        reply.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
}

/*export async function getTournamentBracket(req: FastifyRequest<TournamentIdParamRoute>,
    reply: FastifyReply) {
    try {
        const bracket = await svc.getBracket(+req.params.id);
        reply.status(200).send({
            success: true,
            message: 'Tournament bracket retrieved successfully',
            data: bracket,
        });
    } catch (error) {
        reply.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
}*/

export async function getTournamentBracket(req: FastifyRequest<TournamentIdParamRoute>,
    reply: FastifyReply) {
    try {
        const bracketDataFromService = await svc.getBracket(+req.params.id);
        console.log('[getTournamentBracket Controller] Data from service:', JSON.stringify(bracketDataFromService, null, 2)); // Log before wrapping in 'data'
        reply.status(200).send({
            success: true,
            message: 'Tournament bracket retrieved successfully',
            data: bracketDataFromService, // This is what the frontend receives as 'bracket.data'
        });
    } catch (error) {
        console.error('[getTournamentBracket Controller] Error:', error);
        reply.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
}

export async function submitTournamentResult(req: FastifyRequest<SubmitTournamentMatchResultRoute>,
    reply: FastifyReply) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        if (!token) throw new Error('Missing token'); // debug: This would return 500 with "Missing token"
        const result = await svc.submitTournamentResult(+req.params.matchId, req.body, token);
        reply.status(200).send({
            success: true,
            message: 'Tournament match result submitted successfully',
            data: result,
        });
    } catch (error) {
        // ADD FOR DEBUG
        console.error('Error in submitTournamentResult controller:', error);
        // Make the error message more descriptive if it's an Error object
        let errorMessage = 'Internal server error';
        if (error instanceof Error) {
            errorMessage = error.message;
            if (errorMessage.includes('Match with ID') ||
                errorMessage.includes('Match already completed') ||
                errorMessage.includes('This match cannot be submitted yet') ||
                errorMessage.includes('Invalid score format') ||
                errorMessage.includes('User service error')) {
                reply.status(400);
            }
        }
        reply.status(reply.statusCode === 200 ? 500 : reply.statusCode).send({
            success: false,
            message: errorMessage,
        });
    }
}
