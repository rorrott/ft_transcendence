//backend/auth-service/src/middleware/auth.middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { findUserById } from '../services/user.service.js';
import { SafeAuthUser } from '../models/auth.models.js';

interface JwtPayload {
    userId: number;
    twoFactor?: boolean;
}

declare module 'fastify' {
    interface FastifyRequest { user?: SafeAuthUser; }
}

const getJwtSecret = (): string => {
    if (!JWT_SECRET)
        throw new Error('JWT_SECRET is not defined in environment variables');
    return JWT_SECRET;
};

export const authorize = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer '))
            return res.status(401).send({ message: 'Unauthorized: No token provided or invalid format.' });
        const token = authHeader.split(' ')[1];
        const secret = getJwtSecret(); 
        const decoded = jwt.verify(token, secret) as JwtPayload;
        if (typeof decoded !== 'object' || decoded === null || !('userId' in decoded) || typeof decoded.userId !== 'number')
            throw new Error('Invalid token payload structure.');
        if (decoded.twoFactor === true)
            return res.status(403).send({ message: 'Forbidden: Complete 2FA to proceed.' });
        const user = await findUserById(decoded.userId);
        if (!user)
            return res.status(401).send({ message: 'Unauthorized: User not found.' });
        req.user = user;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError')
            return res.status(401).send({ message: 'Unauthorized: Token expired.', error: error.message });
        if (error.name === 'JsonWebTokenError')
            return res.status(401).send({ message: 'Unauthorized: Invalid token.', error: error.message });
        return res.status(401).send({
            message: 'Unauthorized: An unexpected error occurred.',
            error: error.message,
        });
    }
};

export const authorizeSkip2FA = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer '))
            return res.status(401).send({ message: 'Unauthorized: No token provided or invalid format.' });
        const token = authHeader.split(' ')[1];
        const secret = getJwtSecret(); 
        const decoded = jwt.verify(token, secret) as JwtPayload;
        if (typeof decoded !== 'object' || decoded === null || !('userId' in decoded) || typeof decoded.userId !== 'number')
            throw new Error('Invalid token payload structure.');
        const user = await findUserById(decoded.userId);
        if (!user)
            return res.status(401).send({ message: 'Unauthorized: User not found.' });
        req.user = user;
    } catch (err: any) {
        if (err.name === 'TokenExpiredError')
            return res.status(401).send({ message: 'Unauthorized: Token expired.', error: err.message });
        if (err.name === 'JsonWebTokenError')
            return res.status(401).send({ message: 'Unauthorized: Invalid token.', error: err.message });
        return res.status(401).send({ message: 'Unauthorized: An unexpected error occurred.', error: err.message });
    }
};
