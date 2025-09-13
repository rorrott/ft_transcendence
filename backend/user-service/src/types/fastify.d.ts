//backend/user-service/src/types/fastify.d.ts
export interface AuthUserSanitizedPayload {
    id: number;
    email: string;
    name?: string;
    twoFactorEnabled?: boolean;
}

declare module 'fastify' {
    interface FastifyRequest {
        user?: AuthUserSanitizedPayload;
    }
}

export interface localOpponentQuery {
    username: string;
}