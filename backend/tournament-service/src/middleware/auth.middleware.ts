//backend/tournament-service/src/middleware/auth.middleware.ts
import { verifyToken } from '../utils/verify.token.js';
import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { AuthUserSanitizedPayload } from '../types/fastify.js'

interface AuthVerifyResponseData {
    id: number;
    email: string;
}
interface AuthenticatedUser {
    id: number;
    email: string;
}

export const authorize = async <RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    req: FastifyRequest<RouteGeneric>, res: FastifyReply) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).send({
                message: 'Unauthorized: Missing or invalid authorization header.'
            });
        }
        const token = authHeader.split(' ')[1];
        const decoded = await verifyToken(token);
        if (typeof decoded === 'number') {
            req.user = { id: decoded, email: 'unknown' };
        } else if (typeof decoded === 'object' && decoded !== null && 'id' in decoded && 
            typeof decoded.id === 'number' && 'email' in decoded && typeof decoded.email === 'string') {
            req.user = { id: decoded.id, email: decoded.email };
        } else {
            return res.status(401).send({
                message: 'Unauthorized: Invalid data received from authentication service.'
            });
        }
    } catch (error) {
        console.error('Error during authorization:', error);
         const statusCode = (error as any).statusCode || 401;
        const message = error instanceof Error ? error.message : 'An unknown error occurred during authorization.';
        return res.status(statusCode).send({
            message: 'Unauthorized',
            error: message,
        });
    }
};
