//backend/user-service/src/controllers/user.controllets.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { User, UserData } from '../models/user.models.js';

interface CreateUserRequestBody {
	id?: number;
	name: string;
	email: string;
}

/**
 * Handles the creation of a new user.
 */
export const createUser = async (req: FastifyRequest<{ Body: CreateUserRequestBody }>, reply: FastifyReply) => {
	try {
		const { id, name, email } = req.body;
		if (!email || !name)
			return reply.status(400).send({ success: false, message: 'Email and Name are required.' });
    	// Check if user already exists by email to provide a more specific error for UI
		const existingUser = await User.findByEmail(email);
		if (existingUser)
			return reply.status(409).send({ success: false, message: 'User with this email already exists.' });
		const newUser = await User.create({ id, name, email });
		return reply.status(201).send({ success: true, data: User.sanitize(newUser) });
	} catch (error: any) {
		if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE constraint failed')) {
			return reply.status(409).send({ success: false, message: 'User with this email already exists.' });
		}
		console.error('USER_SERVICE: Error creating user:', error);
		return reply.status(500).send({ success: false, message: (error as Error).message || 'An unexpected error occurred during user creation.' });
	}
};

/**
 * Retrieves the profile of the currently authenticated user.
 */
/*export const getCurrentUserProfile = async (req: FastifyRequest, reply: FastifyReply) => {
	if (!req.user || !req.user.id)
		return reply.status(401).send({ success: false, message: 'Unauthorized: User ID not available from token.' });
	try {
		const userId = req.user.id;
		const userProfile = await User.findById(userId);
		if (!userProfile)
			return reply.status(404).send({ success: false, message: 'User profile not found.' });
		return reply.status(200).send({ success: true, data: userProfile });
	} catch (error: any) {
		console.error('USER_SERVICE: Error fetching current user profile:', error);
		return reply.status(500).send({ success: false, message: (error as Error).message || 'An unexpected error occurred.' });
	}
};*/

/**
 * Updates the details of the currently authenticated user.
 */
/*export const updateOwnUserDetails = async (req: FastifyRequest<{ Body: UpdateUserRequestBody }>, reply: FastifyReply) => {
	if (!req.user || !req.user.id)
		return reply.status(401).send({ success: false, message: 'Unauthorized: User ID not available from token.' });
	try {
		const userId = req.user.id;
		const { name, email, avatar, wins, losses, onlineStatus } = req.body;
		if (!name && !email && !avatar && wins === undefined && losses === undefined && onlineStatus === undefined)
			return reply.status(400).send({ success: false, message: 'No data provided for update.' });
		// Prepare data to send to the update method
		const updateData: Partial<UserData> = {};
		if (name !== undefined) updateData.name = name;
		if (email !== undefined) updateData.email = email;
		if (avatar !== undefined) updateData.avatar = avatar;
		if (wins !== undefined) updateData.wins = wins;
		if (losses !== undefined) updateData.losses = losses;
		if (onlineStatus !== undefined) updateData.onlineStatus = onlineStatus;
		const success = await User.update(userId, updateData);
		if (!success) {
      		const existingUser = await User._findByIdRaw(userId);
      		if (!existingUser)
          		return reply.status(404).send({ success: false, message: 'User not found.' });
      		return reply.status(400).send({ success: false, message: 'Failed to update user details, or no changes were made.' });
    	}
    	const updatedUser = await User.findById(userId);
    	return reply.status(200).send({ success: true, message: 'User updated successfully.', data: updatedUser });
	} catch (error: any) {
		if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE constraint failed')) {
			return reply.status(409).send({ success: false, message: 'Email already in use by another user.' });
    	}
    	console.error('USER_SERVICE: Error updating user details:', error);
    	return reply.status(500).send({ success: false, message: (error as Error).message || 'An unexpected error occurred during user update.' });
  	}
};*/

/**
 * Retrieves a user's profile by ID. Can be used by other users or for admin purposes.
 */
/*export const getUserProfileById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	const userId = parseInt(req.params.id, 10);
	if (isNaN(userId))
		return reply.status(400).send({ success: false, message: 'Invalid user ID format.' });
	try {
		const userProfile = await User.findById(userId);
        if (!userProfile)
            return reply.status(404).send({ success: false, message: 'User profile not found.' });
		return reply.status(200).send({ success: true, data: userProfile });
	} catch (error: any) {
		console.error(`USER_SERVICE: Error fetching user profile for ID ${userId}:`, error);
		return reply.status(500).send({ success: false, message: (error as Error).message || 'An unexpected error occurred.' });
	}
};*/

/**
 * Deletes the currently authenticated user's account.
 */
/*export const deleteOwnAccount = async (req: FastifyRequest, reply: FastifyReply) => {
	if (!req.user || !req.user.id)
		return reply.status(401).send({ success: false, message: 'Unauthorized: User ID not available from token.' });
	try {
		const userId = req.user.id;
		const success = await User.delete(userId);
		if (!success)
			return reply.status(404).send({ success: false, message: 'User not found or could not be deleted.' });
		return reply.status(200).send({ success: true, message: 'Account deleted successfully.' });
	} catch (error: any) {
		console.error('USER_SERVICE: Error deleting own account:', error);
		return reply.status(500).send({ success: false, message: (error as Error).message || 'An unexpected error occurred during account deletion.' });
	}
};*/

/**
 * Retrieves the leaderboard of users by wins.
 */
/*export const getLeaderboard = async (req: FastifyRequest, reply: FastifyReply) => {
	try {
		const leaderboard = await User.getLeaderboard();
		return reply.status(200).send({ success: true, data: leaderboard });
	} catch (error: any) {
		console.error('USER_SERVICE: Error fetching leaderboard:', error);
		return reply.status(500).send({ success: false, message: (error as Error).message || 'An unexpected error occurred.' });
	}
};*/


















/*import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { User } from '../models/user.models.js';

interface GetUserRoute extends RouteGenericInterface {
	Params: {
		id: string;
	};
}
// Get all users
export const getUsers = async (req: FastifyRequest, res: FastifyReply) => {
	try {
		const users = await User.findAll({
			attributes: { exclude: ['password'] }
		});
		return res.status(200).send({ success: true, data: users });
  	} catch (error) {
    	return res.status(500).send({ success: false, message: (error as Error).message });
  	}
};
// Get a single user by ID
export const getUser = async (req: FastifyRequest<GetUserRoute>, res: FastifyReply) => {
	try {
    	const { id } = req.params;
    	const user = await User.findByPk(id, {
      		attributes: { exclude: ['password'] }
    	});
    	if (!user)
			return res.status(404).send({ success: false, message: 'User not found' });
    	return res.status(200).send({ success: true, data: user });
  	} catch (error) {
    	return res.status(500).send({ success: false, message: (error as Error).message });
  	}
};


interface CreateUserRequestBody {
    id?: number;
    name: string;
    email: string;
}

export const createUser = async (req: FastifyRequest<{ Body: CreateUserRequestBody }>, reply: FastifyReply) => {
    try {
        const { id, name, email } = req.body;
        if (!email || !name)
            return reply.status(400).send({ success: false, message: 'Email and Name are required' });
        const newUser = await User.create({ id, name, email });
        return reply.status(201).send({ success: true, data: newUser });
    } catch (error: any) {
        if (error.name === 'SequelizeUniqueConstraintError')
            return reply.status(409).send({ success: false, message: 'User with this email already exists' });
        console.error('USER_SERVICE: Error creating user:', error);
        return reply.status(500).send({ success: false, message: (error as Error).message });
    }
};*/