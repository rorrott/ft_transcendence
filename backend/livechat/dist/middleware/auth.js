"use strict";
// import { FastifyRequest, FastifyReply } from 'fastify';
// import jwt from 'jsonwebtoken';
// import { JWT_SECRET } from '../config/env';
// interface JwtPayload {
// 	userId: number;
// 	twoFactor?: boolean; // adding this
// }
// // Extend Fastify request type to include `user`
// declare module 'fastify' {
// 	interface FastifyRequest {
// 		user?: any;
// 	}
// }
// export const authorize = async (req: FastifyRequest, res: FastifyReply) => {
// 	try {
// 		const authHeader = req.headers.authorization;
// 		if (!authHeader || !authHeader.startsWith('Bearer ')) {
// 			return res.status(401).send({ message: 'Unauthorized' });
// 		}
// 		const token = authHeader.split(' ')[1];
// 		if (!JWT_SECRET) throw new Error('JWT_SECRET not set');
// 		const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
// 		/* ------- adding this --------- */
// 		if (decoded.twoFactor) {
//   			return res.status(401).send({ message: 'Complete 2FA to proceed' });
// 		}
// 		/*------------------------------- */
// 		if (!decoded || typeof decoded !== 'object' || !('userId' in decoded))
// 			throw new Error('Invalid token payload');
// 		const userId = decoded.userId
// 		req.user= userId;
// 	} catch (error) {
// 		return res.status(401).send({
// 			message: 'Unauthorized',
// 			error: (error as Error).message,
// 		});
// 	}
// };
