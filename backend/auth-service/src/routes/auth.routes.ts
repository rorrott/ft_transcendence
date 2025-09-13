//backend/auth-service/src/routes/auth.routes.ts
import { FastifyInstance } from 'fastify';
import { signUp, signIn, deleteAuthUser, /*signOut*/ } from '../controllers/auth.controllers.js';
import { generate2FA, verify2FA } from '../controllers/2fa.controllers.js';
import { authorizeSkip2FA } from '../middlewares/auth.middleware.js';
import { googleAuth ,redirectToGoogle, handleGoogleCallback } from '../controllers/google-auth.controller.js';
import { buildRateLimit, rateLimitConfig } from '../utils/rateLimitOptions.js';

async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/sign-up', buildRateLimit(rateLimitConfig.signUp), signUp);
    fastify.post('/sign-in', buildRateLimit(rateLimitConfig.signIn), signIn);
    fastify.post('/google-auth', buildRateLimit(rateLimitConfig.googleAuth), googleAuth);
    fastify.post('/2fa/setup', { preHandler: authorizeSkip2FA }, generate2FA);
    fastify.post('/2fa/verify', { preHandler: [authorizeSkip2FA], 
          config: buildRateLimit(rateLimitConfig.verify2FA).config, }, verify2FA);
    fastify.get('/google/redirect', redirectToGoogle);
    fastify.get('/google/callback', handleGoogleCallback);
    fastify.delete('/internal/auth-user/:id', deleteAuthUser);
}

export default authRoutes;
