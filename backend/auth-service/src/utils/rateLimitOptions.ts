//backend/auth-service/src/utils/rateLimitOptions.ts
import { RateLimitOptions } from '@fastify/rate-limit';

const isProd = process.env.NODE_ENV === 'production';

export const rateLimitConfig = {
    signIn: { max: Number(process.env.RATE_LIMIT_SIGN_IN_MAX ?? 5), timeWindow: process.env.RATE_LIMIT_SIGN_IN_WINDOW ?? '1 minute',
        message: 'Too many login attempts. Please try again in a minute.', },
    signUp: { max: Number(process.env.RATE_LIMIT_SIGN_UP_MAX ?? 5), timeWindow: process.env.RATE_LIMIT_SIGN_UP_WINDOW ?? '1 minute',
        message: 'Too many sign-up attempts. Please try again in a minute.', },
    googleAuth: { max: Number(process.env.RATE_LIMIT_GOOGLE_AUTH_MAX ?? 5), timeWindow: process.env.RATE_LIMIT_GOOGLE_AUTH_WINDOW ?? '1 minute',
        message: 'Too many Google Auth attempts. Please try again shortly.', },
    resend2FA: { max: Number(process.env.RATE_LIMIT_2FA_RESEND_MAX ?? 3), timeWindow: process.env.RATE_LIMIT_2FA_RESEND_WINDOW ?? '1 minute',
        message: 'Too many 2FA code requests. Please wait a bit.', },
    verify2FA: { max: Number(process.env.RATE_LIMIT_2FA_VERIFY_MAX ?? 5), timeWindow: process.env.RATE_LIMIT_2FA_VERIFY_WINDOW ?? '1 minute',
        message: 'Too many 2FA attempts. Please try again in a minute.', },
};

export const buildRateLimit = ({ max, timeWindow, message, }: {
    max: number;
    timeWindow: string | number;
    message: string;
}): { config: { rateLimit: RateLimitOptions } } => ({
    config: {
        rateLimit: {
            max,
            timeWindow,
            errorResponseBuilder: () => ({
                statusCode: 429,
                error: 'Too Many Requests',
                message,
            }),
        },
    },
});
