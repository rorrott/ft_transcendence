//backend/auth-service/src/controllers/auth.controllets.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';

import { createUser, deleteUserById, findUserByEmail, findUserByEmailWithSensitiveData } from '../services/user.service.js';
import { JWT_SECRET } from '../config/env.js';
import { userServiceClient } from '../utils/userServiceClient.js';
import { NewAuthUser} from '../models/auth.models.js';
import { storeOtp } from '../services/otp.service.js';
import { sendOtpEmail } from '../utils/email.js';

const getJwtSecret = (): string => {
	if (!JWT_SECRET)
		throw new Error('JWT_SECRET is not defined in environment variables');
	return JWT_SECRET;
};

export const signUp = async (req: FastifyRequest, res: FastifyReply) => {
	try {
		const { name, email, password } = req.body as {
			name: string;
			email: string;
			password: string;
		};
		if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 20) {
			return res.status(400).send({
				success: false,
				message: 'Name must be a string between 2 and 20 characters.',
			});
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
			return res.status(400).send({
				success: false,
				message: 'Invalid email format.',
			});
		}
		const passwordValid = typeof password === 'string' && password.length >= 8 && /[a-z]/.test(password) &&
			/[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
		if (!passwordValid) {
			return res.status(400).send({
				success: false,
				message:
					'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
			});
		}
		const existingUser = findUserByEmail(email);
		if (existingUser) {
			return res.status(409).send({
				success: false,
				message: 'User already exists',
			});
		}
		const newUserInput: NewAuthUser = {
			name: name.trim(),
			email: email.toLowerCase(),
			password,
			twoFactorEnabled: true,
			twoFactorSecret: null,
			twoFactorMethod: 'email',
		};
		const newUser = await createUser(newUserInput);
		if (!newUser) throw new Error('Failed to create user during database operation.');
		await userServiceClient.post('/', {
			id: newUser.id,
			name: newUser.name,
			email: newUser.email,
		});
		const token = jwt.sign(
			{ userId: newUser.id, userName: newUser.name },
			getJwtSecret(),
			{ expiresIn: '1h' }
		);
		return res.status(201).send({
			success: true,
			message: 'User created successfully',
			data: {
				token,
				user: newUser,
			},
		});
	} catch (error: any) {
		console.error('SignUp error:', error);
		return res.status(error.statusCode || 500).send({
			success: false,
			message: error.message || 'Internal server error',
		});
	}
};

export const signIn = async (req: FastifyRequest, res: FastifyReply) => {
	try {
		const { email, password } = req.body as {
			email: string;
			password: string;
		};
		const user = await findUserByEmailWithSensitiveData(email);
		if (!user) {
			return res.status(404).send({
				success: false,
				message: 'User not found',
			});
		}
		const isPasswordValid = await bcrypt.compare(password, user.password!);
		if (!isPasswordValid) {
			return res.status(401).send({
				success: false,
				message: 'Invalid email or password',
			});
		}
		const secret = getJwtSecret();
		const { password: _, twoFactorSecret: __, ...userResponse } = user;
		if (user.twoFactorEnabled) {
			const tempToken = jwt.sign(
				{ userId: user.id, userName:user.name, twoFactor: true },
				secret,
				{ expiresIn: '5m' }
			);
  			if (user.twoFactorMethod === 'email') {
    			const otp = Math.floor(100000 + Math.random() * 900000).toString();
    			const stored = await storeOtp(user.id, otp);
    			if (!stored) {
      				return res.status(500).send({
        				success: false,
        				message: 'Failed to store OTP code.',
      				});
    			}
				try {
					await sendOtpEmail(user.email, otp);
				} catch (err) {
					return res.status(500).send({ success: false, message: 'Failed to send OTP email.' });
				}
  			}
			return res.send({
				success: true,
				message: '2FA code required',
				twoFactorRequired: true,
				tempToken
			});
		}
		const signOptions: SignOptions = {
			expiresIn: '1h',
		};
		const token = jwt.sign(
			{ userId: user.id, userName: user.name },
			secret,
			signOptions
		);
		return res.status(200).send({
			success: true,
			message: 'User signed in successfully',
			data: {
				token,
				user: userResponse,
			}
		});
	} catch (error: any) {
		console.error('SignIn error:', error);
		return res.status(error.statusCode || 500).send({
			success: false,
			message: error.message || 'Internal server error',
		});
	}
};

export const deleteAuthUser = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const userId = parseInt((req.params as { id: string }).id, 10);

        if (isNaN(userId)) {
            return res.status(400).send({ success: false, message: 'Invalid user ID provided.' });
        }

        const deleted = deleteUserById(userId);

        if (deleted) {
            console.log(`Auth user record for ID ${userId} deleted successfully.`);
            return res.status(200).send({ success: true, message: 'Auth user record deleted successfully.' });
        } else {
            return res.status(404).send({ success: false, message: 'Auth user not found or already deleted.' });
        }
    } catch (error: any) {
        console.error('Error in deleteAuthUser controller:', error);
        return res.status(error.statusCode || 500).send({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
}
