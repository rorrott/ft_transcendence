// backend/auth-service/src/controllers/google-auth.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import jwt, { SignOptions } from 'jsonwebtoken';

import { createUser, findUserByEmail, findUserByEmailWithSensitiveData } from '../services/user.service.js';
import { JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from '../config/env.js';
import { userServiceClient } from '../utils/userServiceClient.js';
import { AuthUser, NewAuthUser, SafeAuthUser } from '../models/auth.models.js';

//const client = new OAuth2Client();
const client = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
);

const getJwtSecret = (): string => {
    if (!JWT_SECRET)
        throw new Error('JWT_SECRET is not defined in environment variables');
    return JWT_SECRET;
};

// Step 1: Redirect to Google login
export const redirectToGoogle = async (req: FastifyRequest, reply: FastifyReply) => {
    const authorizeUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: ['profile', 'email'],
        prompt: 'consent',
    });
    return reply.redirect(authorizeUrl);
};

// Step 2: Handle callback
export const handleGoogleCallback = async (req: FastifyRequest, reply: FastifyReply) => {
    const { code } = req.query as { code: string };
    if (!code) return reply.status(400).send({ message: 'Missing code from Google' });
    try {
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token!,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.name)
            return reply.status(400).send({ message: 'Invalid Google payload' });
        const { email, name } = payload;
        let user = await findUserByEmail(email);
        if (!user) {
            user = await createUser({
                name,
                email,
                password: '',
                twoFactorEnabled: false,
                twoFactorSecret: null,
            });
            await userServiceClient.post('/', {
                id: user?.id,
                name: user?.name,
                email: user?.email,
            });
        }
        const token = jwt.sign({ userId: user?.id, userName: user?.name }, JWT_SECRET!, { expiresIn: '1h' });
        return reply.redirect(`/login?token=${token}`);
    } catch (err: any) {
        console.error('OAuth2 callback error:', err);
        return reply.status(500).send({ message: 'Google callback failed', error: err.message });
    }
};

export const googleAuth = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const { idToken } = req.body as { idToken: string };
        if (!idToken)
            return res.status(400).send({ message: 'Missing Google ID Token' });
        const ticket = await client.verifyIdToken({
            idToken,
            //audience: process.env.GOOGLE_CLIENT_ID,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.name)
            return res.status(400).send({ message: 'Invalid Google token payload' });
        const { email, name } = payload;
        let user: SafeAuthUser | null = null;
        let createdNewUser = false;
        user = await findUserByEmail(email);
        if (!user) {
            const newUserInput: NewAuthUser = {
                name,
                email,
                password: '',
                twoFactorEnabled: false,
                twoFactorSecret: null
            };
            user = await createUser(newUserInput);
            createdNewUser = true;
            if (!user)
                throw new Error('Failed to create new user during Google auth.');
        }
        if (createdNewUser) {
            try {
                await userServiceClient.post('/', {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                });
            } catch (syncError: any) {
                console.error('User-service sync failed:', syncError.message);
                return res.status(502).send({ message: 'Failed to sync with user-service' });
            }
        }
        const secret = getJwtSecret();
        const signOptions: SignOptions = {
            expiresIn: '1h',//JWT_SECRET || '1h',
        };
        const token = jwt.sign({ userId: user.id, userName: user.name }, secret, signOptions);
        return res.send({
            success: true,
            message: 'Google sign-in successful',
            data: {
                token,
                user,
            }
        });
    } catch (err: any) {
        console.error('Google auth error:', err);
        if (err.message === 'Failed to create new user during Google auth.')
            return res.status(500).send({ message: err.message });
        return res.status(err.statusCode || 500).send({
            success: false,
            message: 'Google authentication failed',
            error: err.message,
        });
    }
};



/*import { FastifyRequest, FastifyReply } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import jwt, { SignOptions } from 'jsonwebtoken';

import { createUser, findUserByEmail, findUserByEmailWithSensitiveData } from '../services/user.service.js';
import { JWT_SECRET, GOOGLE_CLIENT_ID } from '../config/env.js';
import { userServiceClient } from '../utils/userServiceClient.js';
import { AuthUser, NewAuthUser, SafeAuthUser } from '../models/auth.models.js';

const client = new OAuth2Client();
const getJwtSecret = (): string => {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return JWT_SECRET;
};

export const googleAuth = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const { idToken } = req.body as { idToken: string };
        if (!idToken)
            return res.status(400).send({ message: 'Missing Google ID Token' });
        const ticket = await client.verifyIdToken({
            idToken,
            //audience: process.env.GOOGLE_CLIENT_ID,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.name)
            return res.status(400).send({ message: 'Invalid Google token payload' });
        const { email, name } = payload;
        let user: SafeAuthUser | null = null;
        let createdNewUser = false;
        user = await findUserByEmail(email);
        if (!user) {
            const newUserInput: NewAuthUser = {
                name,
                email,
                password: '',
                twoFactorEnabled: false,
                twoFactorSecret: null
            };
            user = await createUser(newUserInput);
            createdNewUser = true;
            if (!user)
                throw new Error('Failed to create new user during Google auth.');
        }
        if (createdNewUser) {
            try {
                await userServiceClient.post('/', {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                });
            } catch (syncError: any) {
                console.error('User-service sync failed:', syncError.message);
                return res.status(502).send({ message: 'Failed to sync with user-service' });
            }
        }
        const secret = getJwtSecret();
        const signOptions: SignOptions = {
            expiresIn: '1h',//JWT_SECRET || '1h',
        };
        const token = jwt.sign({ userId: user.id }, secret, signOptions);
        return res.send({
            success: true,
            message: 'Google sign-in successful',
            data: {
                token,
                user,
            }
        });
    } catch (err: any) {
        console.error('Google auth error:', err);
        if (err.message === 'Failed to create new user during Google auth.')
            return res.status(500).send({ message: err.message });
        return res.status(err.statusCode || 500).send({
            success: false,
            message: 'Google authentication failed',
            error: err.message,
        });
    }
};*/