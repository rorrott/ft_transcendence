// backend/auth-service/src/controllers/2fa.controllers.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';

import { findUserByIdWithSensitiveData, updateUserTwoFactor } from '../services/user.service.js';
import { JWT_SECRET } from '../config/env.js';
import { AuthUser, SafeAuthUser } from '../models/auth.models.js';
import { getStoredOtp, storeOtp } from '../services/otp.service.js'; // adding this
import { sendOtpEmail } from '../utils/email.js';
//import { sendOtpEmail } from '../services/email.service.js';


interface AuthenticatedRequest extends FastifyRequest {
	user?: SafeAuthUser;
}

interface JwtPayload {
	userId: number;
	twoFactor?: boolean;
}

interface Verify2FARequest extends FastifyRequest {
	body: {
		token?: string;
	};
}

const getJwtSecret = (): string => {
	if (!JWT_SECRET)
		throw new Error('JWT_SECRET is not defined in environment variables');
	return JWT_SECRET;
};

const respond = (res: FastifyReply, status: number, message: string) =>
  res.status(status).send({ message });

/**
 * POST /2fa/generate
 */
export const generate2FA = async (req: AuthenticatedRequest, res: FastifyReply) => {
	const userId = req.user?.id;
	if (!userId) return respond(res, 401, 'User not authenticated');
	const user = await findUserByIdWithSensitiveData(userId);
	if (!user) return respond(res, 404, 'User not found');
	if (user.twoFactorMethod === 'email') {
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const stored = await storeOtp(user.id, otp);
    	if (!stored) {
			console.error('[ERROR] Failed to store OTP in DB.');
      		return res.status(500).send({
        		success: false,
        		message: 'Failed to store OTP code.',
      		});
    	}
    	try {
      		console.log(`[DEBUG] Attempting to send OTP to ${user.email}`);
      		await sendOtpEmail(user.email, otp);
      		//console.log('[DEBUG] OTP email send process completed');
    	} catch (err) {
      		//console.error('[ERROR] Failed to send OTP email:', err);
      		return respond(res, 500, 'Failed to send OTP email');
    	}
    	return res.send({
      		success: true,
      		message: 'OTP has been sent to your email.',
      		twoFactorEnabled: true
    	});
  	}
	// fallback to TOTP (authenticator app)
	const secret = speakeasy.generateSecret();
  	const saved = await updateUserTwoFactor(user.id, secret.base32, user.twoFactorEnabled);
  	if (!saved) return respond(res, 500, 'Failed to save 2FA secret');
	const qrCode = await qrcode.toDataURL(secret.otpauth_url ?? '');
	return res.send({
    	success: true,
    	message: '2FA setup initiated. Scan QR or use manual code to continue.',
    	twoFactorEnabled: true,
    	qrCode,
    	manualEntry: secret.base32
  	});
};

/**
 * POST /2fa/verify
 */
export const verify2FA = async (req: FastifyRequest, res: FastifyReply) => {
	const { token } = req.body as { token?: string };
  	const authHeader = req.headers.authorization;
	const jwtToken = authHeader?.split(' ')[1];
	const secret = getJwtSecret();

	if (!jwtToken) return respond(res, 401, 'Token required');
	if (!token || !/^\d{6}$/.test(token)) return respond(res, 400, 'Invalid 2FA code format');
	let payload: JwtPayload;
	try {
		payload = jwt.verify(jwtToken, secret) as JwtPayload;
	} catch {
		return respond(res, 401, 'Invalid or expired token');
	}
	if (!payload.userId || payload.twoFactor !== true)
		return respond(res, 403, 'Invalid 2FA verification token');
	const user = await findUserByIdWithSensitiveData(payload.userId);
	if (!user) return respond(res, 404, 'User not found');
	let isVerified = false;
	// Check 2FA method
	if (user.twoFactorMethod === 'email') {
		const storedCode = getStoredOtp(user.id);
		if (storedCode && storedCode === token)
    		isVerified = true;
	} else if (user.twoFactorMethod === 'totp' && user.twoFactorSecret) {
		isVerified = speakeasy.totp.verify({
			secret: user.twoFactorSecret,
			encoding: 'base32',
			token,
			window: 1
		});
	}
	if (!isVerified) return respond(res, 401, 'Invalid or expired 2FA code');
	if (!user.twoFactorEnabled && user.twoFactorSecret) {
		const success = await updateUserTwoFactor(user.id, user.twoFactorSecret, true);
		if (!success) {
			console.error(`Failed to enable 2FA for user ID ${user.id}`);
			return respond(res, 500, 'Failed to enable 2FA');
		}
	}
	// Issue final session token
	const finalToken = jwt.sign({ userId: user.id, userName: user.name }, secret, { expiresIn: '1h' });
	const safeUser: SafeAuthUser = {
		id: user.id,
		name: user.name,
		email: user.email,
		twoFactorEnabled: true,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt
	};
	return res.send({
		success: true,
		message: '2FA verification successful',
		data: {
			token: finalToken,
			user: safeUser
		}
	});
};

// controllers/2fa-method.controller.ts
export const sendOtpViaMethod = async (req: FastifyRequest, res: FastifyReply) => {
  const { method, destination } = req.body as { method: 'sms' | 'email'; destination: string };

  if (!method || !destination) {
    return res.status(400).send({ message: 'Method and destination are required.' });
  }

  // Mock logic here – replace with real SMS/Email sending logic
  return res.send({
    success: true,
    message: `OTP sent via ${method} to ${destination}.`
  });
};

/*export const sendOtpViaMethod = async (req: FastifyRequest, res: FastifyReply) => {
  const { method, destination } = req.body as { method: 'sms' | 'email'; destination: string };

  if (!method || !destination) {
    return res.status(400).send({ message: 'Method and destination are required.' });
  }

  // Mock logic here – replace with real SMS/Email sending logic
  return res.send({
    success: true,
    message: `OTP sent via ${method} to ${destination}.`
  });
};*/




/*export const verify2FA = async (req: FastifyRequest, res: FastifyReply) => {
  const { token } = req.body as { token?: string };
  const authHeader = req.headers.authorization;
  const jwtToken = authHeader?.split(' ')[1];
  const secret = getJwtSecret();

  if (!jwtToken) return respond(res, 401, 'Token required');
  if (!token || !/^\d{6}$/.test(token)) return respond(res, 400, 'Invalid 2FA code format');

  let payload: JwtPayload;
  try {
    payload = jwt.verify(jwtToken, secret) as JwtPayload;
  } catch {
    return respond(res, 401, 'Invalid or expired token');
  }

  if (!payload.userId || payload.twoFactor !== true)
    return respond(res, 403, 'Invalid 2FA verification token');

  const user = await findUserByIdWithSensitiveData(payload.userId);
  if (!user || !user.twoFactorSecret)
    return respond(res, 404, 'User not found or 2FA not setup');

  const isVerified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1
  });

  if (!isVerified) return respond(res, 401, 'Invalid 2FA token');

  if (!user.twoFactorEnabled) {
    const success = await updateUserTwoFactor(user.id, user.twoFactorSecret, true);
    if (!success) {
      console.error(`Failed to enable 2FA for user ID ${user.id}`);
      return respond(res, 500, 'Failed to enable 2FA');
    }
  }

  const finalToken = jwt.sign({ userId: user.id }, secret, { expiresIn: '1h' });

  const safeUser: SafeAuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    twoFactorEnabled: true,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  return res.send({
    success: true,
    message: '2FA verification successful',
    data: {
      token: finalToken,
      user: safeUser
    }
  });
};*/


/*import { FastifyRequest, FastifyReply } from 'fastify';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';

import { findUserByIdWithSensitiveData, updateUserTwoFactor } from '../services/user.service.js';
import { JWT_SECRET } from '../config/env.js';
import { AuthUser, SafeAuthUser } from '../models/auth.models.js';

interface AuthenticatedRequest extends FastifyRequest {
	user?: SafeAuthUser;
}

const getJwtSecret = (): string => {
	if (!JWT_SECRET) {
		throw new Error('JWT_SECRET is not defined in environment variables');
	}
	return JWT_SECRET;
};

// POST /2fa/generate
export const generate2FA = async (req: AuthenticatedRequest, res: FastifyReply) => {
	const userId = req.user?.id;
	if (!userId) return res.status(401).send({ message: 'User not authenticated' });
	const user = findUserByIdWithSensitiveData(userId);//await findUserByIdWithSensitiveData(userId);
	if (!user) return res.status(404).send({ message: 'User not found' });
	const secret = speakeasy.generateSecret();
	const updated = await updateUserTwoFactor(user.id, secret.base32, user.twoFactorEnabled);
	if (!updated) return res.status(500).send({ message: 'Failed to save 2FA secret' });
	const qrCode = await qrcode.toDataURL(secret.otpauth_url ?? '');
	return res.send({
		success: true,
		message: '2FA setup initiated. Scan QR or use manual code to continue.',
		twoFactorEnabled: true,//false,
		qrCode,
		manualEntry: secret.base32
	});
};

// POST /2fa/verify
export const verify2FA = async (req: FastifyRequest, res: FastifyReply) => {
	const { token } = req.body as { token?: string };
	const authHeader = req.headers.authorization;
	const jwtToken = authHeader?.split(' ')[1];
	const secret = getJwtSecret();

	if (!jwtToken) return res.status(401).send({ message: 'Token required' });
	// Validate format early
	if (!token || !/^\d{6}$/.test(token))
		return res.status(400).send({ message: 'Invalid 2FA code format' });
	let payload: any;
	try {
		payload = jwt.verify(jwtToken, secret) as { userId: number; twoFactor?: boolean };
	} catch (err) {
		return res.status(401).send({ message: 'Invalid or expired token' });
	}
	if (payload.twoFactor !== true || !payload.userId)
		return res.status(403).send({ message: 'Invalid 2FA verification token' });
	const user = await findUserByIdWithSensitiveData(payload.userId);
	if (!user || !user.twoFactorSecret)
		return res.status(404).send({ message: 'User not found or 2FA not setup' });
	const verified = speakeasy.totp.verify({
		secret: user.twoFactorSecret,
		encoding: 'base32',
		token,
		window: 1
	});
	if (!verified)
		return res.status(401).send({ message: 'Invalid 2FA token' });
	// Enable 2FA if not already active
	if (!user.twoFactorEnabled) {
		const success = await updateUserTwoFactor(user.id, user.twoFactorSecret, true);
		if (!success) {
			console.error(`Failed to enable 2FA for user ID ${user.id}`);
			return res.status(500).send({ message: 'Failed to enable 2FA' });
		}
	}
	const finalToken = jwt.sign(
		{ userId: user.id },
		secret,
		{ expiresIn: '1h' }
	);
	const userResponse: SafeAuthUser = {
		id: user.id,
		name: user.name,
		email: user.email,
		twoFactorEnabled: true,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt
	};
	return res.send({
		success: true,
		message: '2FA verification successful',
		data: {
			token: finalToken,
			user: userResponse
		}
	});
};*/
