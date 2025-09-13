//backend/tournament-service/src/middleware/error.middleware.ts
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
    console.error('Fastify Error Handler:', error);

    let statusCode = 500;
    let message = 'Internal Server Error';

    if (typeof (error as any).statusCode === 'number' && (error as any).statusCode >= 400 && (error as any).statusCode < 600) {
        statusCode = (error as any).statusCode;
        message = error.message;
    } else if (error.message) {
        message = error.message;
        if (message.includes('not found') || message.includes('already completed') || message.includes('not enough players') || message.includes('cannot be submitted yet')) {
            statusCode = 400;
        }
    }
    reply.status(statusCode).send({
        success: false,
        error: message,
    });
}
