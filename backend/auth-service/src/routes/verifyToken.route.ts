//backend/auth-service/src/routes/verifyToken.route.ts
import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { findUserById } from '../services/user.service.js';

interface JwtPayload {
    id: number;
    twoFactor?: boolean;
}

const getJwtSecret = (): string => {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return JWT_SECRET;
};

export default async function verifyTokenRoute(app: FastifyInstance) {
    console.log('>>> verifyTokenRoute: Function executed. Attempting to register /verify-token.');
    app.post('/verify-token', async (req, reply) => {
        try {
            const { token } = req.body as { token: string };
            if (!token)
                return reply.status(400).send({ message: 'Token is required' });
            const secret = getJwtSecret();
            const decoded = jwt.verify(token, secret) as JwtPayload;
            if (typeof decoded !== 'object' || decoded === null || !('userId' in decoded) || typeof decoded.userId !== 'number')
                throw new Error('Invalid token payload structure.');
            
            // If the token indicates it's a temporary 2FA token, it's not a full access token
            if (decoded.twoFactor === true) {
                // Return 403 Forbidden, as the token itself is valid, but doesn't grant full access yet
                return reply.status(403).send({ message: 'Forbidden: 2FA required to proceed.' });
            }
            // Fetch user from the database using the service
            const user = await findUserById(decoded.userId);
            if (!user)
                return reply.status(404).send({ message: 'User not found' });
            // Return basic user information
            return reply.status(200).send({
                id: user.id, // <--- CHANGE THIS FROM 'Id' to 'userId'
                email: user.email,
            });
        } catch (err: any) {
            if (err.name === 'TokenExpiredError')
                return reply.status(401).send({ message: 'Unauthorized: Token expired.', error: err.message });
            if (err.name === 'JsonWebTokenError')
                return reply.status(401).send({ message: 'Unauthorized: Invalid token.', error: err.message });
            return reply.status(401).send({
                message: 'Unauthorized: An unexpected error occurred.',
                error: err.message,
            });
        }
    });
}
