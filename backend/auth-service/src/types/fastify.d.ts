//backend/auth-service/src/types/fastify.d.ts
import { FastifyRequest } from 'fastify';

export interface AuthUserSanitizedPayload {
    id: number;
    email: string;
    name?: string;
    twoFactorEnabled?: boolean;
}

// Extend FastifyRequest to include the 'user' property
declare module 'fastify' {
    interface FastifyRequest {
        user?: AuthUserSanitizedPayload;        
    }
}