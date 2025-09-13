//backend/user-service/src/middleware/error.middleware.ts
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ValidationError, UniqueConstraintError } from 'sequelize';

export function errorHandler(
	error: FastifyError,
	request: FastifyRequest,
  	reply: FastifyReply
	
) {
	console.error(error);
	let statusCode = 500;
	let message = 'Server error';
	// Sequelize Validation Error
	if (error instanceof ValidationError) {
		statusCode = 400;
    	message = error.errors.map(e => e.message).join(', ');
  	}
	// Sequelize Unique Constraint
	else if (error instanceof UniqueConstraintError) {
		statusCode = 400;
    	message = 'Duplicate field value entered';
  	}
	reply.status(statusCode).send({
		success: false,
    	error: message,
  	});
}