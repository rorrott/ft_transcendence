// backend/user-service/src/middlewares/auth.middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/verify.token.js';
import { User, UserData } from '../models/user.models.js';
import { AuthUserSanitizedPayload } from '../types/fastify.js'

export const authorize = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).send({ message: 'Unauthorized: Missing or invalid authorization header.' });
        }
        const token = authHeader.split(' ')[1];
        const decodedPayload = await verifyToken(token) as AuthUserSanitizedPayload;
        if (!decodedPayload || typeof decodedPayload !== 'object' || !('id' in decodedPayload) || typeof decodedPayload.id !== 'number') {
            return res.status(401).send({ message: 'Unauthorized: Invalid token payload from auth service (missing or malformed ID).' });
        }
        const userInUserServiceDB: UserData | null = await User._findByIdRaw(decodedPayload.id);
        if (!userInUserServiceDB) {
            return res.status(401).send({ message: 'Unauthorized: User does not exist in User Service DB.' });
        }
        req.user = decodedPayload;
    } catch (error) {
        console.error('Error during authorization in User Service:', error);
        const errorMessage = (error as Error).message || 'Authentication failed.';
        const statusCode = (error as any).statusCode || 401;
        return res.status(statusCode).send({
            message: 'Unauthorized',
            error: errorMessage,
        });
    }
};

/*export const authorizeAdmin = async (req: FastifyRequest, res: FastifyReply) => {
    if (!req.user)
        return res.status(401).send({ message: 'Unauthorized: User not authenticated.' });
    if (req.user.role === 'admin')
        return;
    else {
        return res.status(403).send({ message: 'Forbidden: Admin access required.' });
    }
};*/
