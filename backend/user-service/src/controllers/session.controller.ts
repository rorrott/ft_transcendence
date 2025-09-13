//backend/user-service/src/controllers/session.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/user.models.js';
import { Friendship } from '../models/friendship.models.js';
import { Match } from '../models/match.models.js';
import { getDb } from '../plugins/sqlite.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:5500/api/v1/auth';

interface UpdateUserRequestBody {
  name: string;
}

export const currentUser = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        console.log('User from token:', req.user);
        if (!req.user || !req.user.id) {
            return res.status(401).send({ success: false, message: 'Unauthorized: No user ID on request' });
        }
        const userId = req.user.id;
        console.log('Extracted userId from req.user:', userId);
        //const user = await User.findById(userId);
        const user = await User.findByIdWithEmail(userId);
        console.log('User object:', user);
        if (!user)
            return res.status(404).send({ success: false, message: 'User not found in DB' });
        return res.status(200).send({
            success: true,
            message: 'User found successfully',
            data: { user },
        });
    } catch (error) {
        return res.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal error',
        });
    }
};


export const addUserLocally = async (req: FastifyRequest<{ Body: UpdateUserRequestBody }>,
  res: FastifyReply) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).send({ success: false, message: 'Unauthorized' });
        }
        const { name } = req.body;
        const newLocalUserName = name || `LocalPlayer_${Math.random().toString(36).substring(7)}`;
        const newLocalUser = {
            name: newLocalUserName,
            email: `local_${Date.now()}@example.invalid`,
        };
        const createdUser = await User.create(newLocalUser);
        if (!createdUser)
            return res.status(500).send({ success: false, message: 'Failed to create user' });
        return res.status(201).send({
            success: true,
            message: 'Local user created successfully',
            data: { user: createdUser },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
};


export const updateCurrentUserName = async (req: FastifyRequest<{ Body: UpdateUserRequestBody }>,
  res: FastifyReply) => {
    try {
        if (!req.user || !req.user.id)
            return res.status(404).send({ success: false, message: 'User not found' });
        const userId = req.user.id;
        console.log('Extracted userId from req.user:', userId);
        const { name } = req.body;
        const updated = await User.update(userId, { name });
        if (!updated)
            return res.status(404).send({ success: false, message: 'User not found or name not changed in DB' });
        const user = await User.findById(userId);
        if (!user)
            return res.status(500).send({ success: false, message: 'Failed to retrieve updated user' });
        return res.status(200).send({
            success: true,
            message: 'Name updated successfully',
            data: { user },
        });
    } catch (error) {
        return res.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
};

interface localOpponentQuery {
    username: string;
}

export async function localOpponent(request: FastifyRequest<{ Querystring: localOpponentQuery }>, reply: FastifyReply) {
    try {
        const username = request.query.username as string;

        if (!username) {
            return reply.status(400).send({
                success: false,
                message: 'Username query parameter is required to get or create a dummy opponent.'
            });
        }

        let user = await User.findByName(username);

        if (user) {
            console.log(`Backend: Found existing user (or dummy) '${username}'.`);
            return reply.status(200).send({
                success: true,
                message: `User '${username}' found.`,
                data: { user: User.sanitize(user) }
            });
        }

        const uniqueEmail = `dummy_${username}_${crypto.randomBytes(4).toString('hex')}@example.com`; 
        const newDummyData = {
            name: username,
            email: uniqueEmail,
            avatar: 'default-dummy-avatar.png',
            wins: 0,
            losses: 0,
            onlineStatus: false,
            is_dummy: true
        };
        const createdDummy = await User.create(newDummyData);

        if (createdDummy) {
            console.log(`Backend: Created new dummy user '${username}' with ID ${createdDummy.id}.`);
            return reply.status(201).send({
                success: true,
                message: `Dummy user '${username}' created successfully.`,
                data: { user: User.sanitize(createdDummy) }
            });
        } else {
            console.error(`Backend: Failed to create dummy user '${username}' in database.`);
            return reply.status(500).send({
                success: false,
                message: 'Failed to create dummy user in database.'
            });
        }

    } catch (error: unknown) {
        console.error('Backend: Error in getOrCreateDummyOpponent:', error);
        let errorMessage = 'An unknown error occurred.';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        reply.status(500).send({
            success: false,
            message: 'Internal server error during dummy user operation.',
            error: errorMessage
        });
    }
}

export const getAllUsers = async (req: FastifyRequest, res: FastifyReply) => {
	try {
		console.log('Fetching all users from DB');
		const users = await User.findAll();

		if (!users || users.length === 0) {
			return res.status(404).send({
				success: false,
				message: 'No users found',
			});
		}
		return res.status(200).send({
			success: true,
			message: 'Users retrieved successfully',
			data: { users },
		});
	} catch (error) {
		console.error('Error fetching users:', error);
		return res.status(500).send({
			success: false,
			message: (error as Error).message || 'Internal server error',
		});
	}
};

export const onlineStatus = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).send({
                success: false,
                message: 'Unauthorized: User ID not available from token.',
            });
        }
        const userId = req.user.id;
        const updated = await User.update(userId, { onlineStatus: true });
        if (!updated) {
            return res.status(404).send({
                success: false,
                message: 'User not found or online status already set.',
            });
        }
        const user = await User.findById(userId);
        if (!user)
            return res.status(500).send({ success: false, message: 'Failed to retrieve updated user data.' });
        return res.status(200).send({
            success: true,
            message: 'User is now online',
            data: { onlineStatus: user.onlineStatus },
        });
    } catch (error) {
        console.error('Error setting online status:', error);
        return res.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
};

export const uploadAvatar = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        if (!req.user || !req.user.id)
            return res.status(401).send({ success: false, message: 'Unauthorized: User ID not available from token.' });
        const userId = req.user.id;
        const data = await req.file();
        if (!data)
            return res.status(400).send({ success: false, message: 'No file uploaded' });
        if (data.file.truncated)
            return res.status(400).send({ success: false, message: 'File is too large. Maximum size is 5MB.' });
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(data.mimetype)) {
            return res.status(400).send({
                success: false,
                message: 'Invalid file type. Only JPG, PNG, and WEBP are allowed.',
            });
        }
        const sanitizedFilename = path.basename(data.filename).replace(/\s+/g, '-');
        const fileName = `${Date.now()}-${sanitizedFilename.slice(0, 100)}`;
        const uploadDir = path.resolve('./uploads');
        const filePath = path.join(uploadDir, fileName);
        if (!fs.existsSync(uploadDir))
            fs.mkdirSync(uploadDir, { recursive: true });
        const writeStream = fs.createWriteStream(filePath);
        await new Promise<void>((resolve, reject) => { 
            data.file.pipe(writeStream);
            data.file.on('end', resolve);
            data.file.on('error', (err: Error) => {
                console.error('File stream error:', err);
                writeStream.destroy(err);
                reject(err);
            });
            writeStream.on('error', (err: Error) => {
                console.error('Write stream error:', err);
                reject(err);
            });
        });
        const updated = await User.update(userId, { avatar: fileName });

        if (!updated)
            return res.status(404).send({ success: false, message: 'User not found or avatar not changed.' });
        return res.status(200).send({
            success: true,
            message: 'Avatar uploaded successfully',
            data: { avatar: fileName },
        });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        return res.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
};

export const addFriend = async (req: FastifyRequest, res: FastifyReply) => {
    const db = getDb();
    await db.run('BEGIN TRANSACTION;');
    try {
        const inviterId = req.user?.id;
        const { friendId } = req.body as { friendId: number };
        if (!inviterId || !friendId || inviterId === friendId) {
            await db.run('ROLLBACK;');
            return res.status(400).send({ success: false, message: 'Invalid inviter or friend ID.' });
        }
        const inviter = await User.findById(inviterId);
        const invitee = await User.findById(friendId);
        if (!inviter || !invitee) {
            await db.run('ROLLBACK;');
            return res.status(404).send({ success: false, message: 'User(s) not found.' });
        }
        const existingFriendship = await Friendship.findByUserAndFriend(inviterId, friendId);
        if (existingFriendship) {
            await db.run('ROLLBACK;');
            return res.status(400).send({ success: false, message: 'Friendship already exists or is pending.' });
        }
        await Friendship.create({ userId: inviterId, friendId: friendId, status: 'pending' });
        await db.run('COMMIT;');
        return res.status(200).send({
            success: true,
            message: 'Friend request sent successfully (or friendship established).',
            data: { inviterId, friendId },
        });
    } catch (error) {
        await db.run('ROLLBACK;');
        console.error('Error adding friend:', error);
        return res.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
};

export const acceptFriendRequest = async (req: FastifyRequest, res: FastifyReply) => {
    const db = getDb();
    await db.run('BEGIN TRANSACTION;');
    try {
        const userId = req.user?.id;
        const { requesterId } = req.body as { requesterId: number };
        if (!userId || !requesterId) {
            await db.run('ROLLBACK;');
            return res.status(400).send({ success: false, message: 'Invalid user or requester ID.' });
        }
        const request = await Friendship.findByUserAndFriend(requesterId, userId);
        if (!request || request.status !== 'pending') {
            await db.run('ROLLBACK;');
            return res.status(404).send({ success: false, message: 'Friend request not found or already handled.' });
        }
        await Friendship.updateStatus(request.id!, 'accepted');
        await db.run('COMMIT;');
        return res.status(200).send({ success: true, message: 'Friend request accepted.' });
    } catch (error) {
        await db.run('ROLLBACK;');
        console.error('Error accepting friend request:', error);
        return res.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
};

export const getFriendsList = async (req: FastifyRequest, res: FastifyReply) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).send({ success: false, message: 'Unauthorized: missing user ID' });
		}

		const friendships = await Friendship.findFriendsForUser(userId);

		const acceptedIds = new Set<number>();
		const pendingSentIds: number[] = [];
		const pendingReceivedIds: number[] = [];

		for (const f of friendships) {
			if (f.status === 'accepted') {
				const otherId = f.userId === userId ? f.friendId : f.userId;
				acceptedIds.add(otherId);
			} else if (f.status === 'pending') {
				if (f.userId === userId) {
					pendingSentIds.push(f.friendId);
				} else if (f.friendId === userId) {
					pendingReceivedIds.push(f.userId);
				}
			}
		}
		const [acceptedFriends, pendingSent, pendingReceived] = await Promise.all([
			Promise.all([...acceptedIds].map(User.findById)),
			Promise.all(pendingSentIds.map(User.findById)),
			Promise.all(pendingReceivedIds.map(User.findById)),
		]);

		return res.status(200).send({
			success: true,
			message: 'Friend list retrieved successfully.',
			data: {
				accepted: acceptedFriends.filter(Boolean),
				pendingSent: pendingSent.filter(Boolean),
				pendingReceived: pendingReceived.filter(Boolean),
			},
		});
	} catch (error) {
		console.error('Error in getFriendsList:', error);
		return res.status(500).send({
			success: false,
			message: (error as Error).message || 'Internal server error.',
		});
	}
};

export const recordMatch = async (req: FastifyRequest, res: FastifyReply) => {
    console.log('User service: Incoming request body for recordMatch:', req.body);
    const db = getDb();
    await db.run('BEGIN TRANSACTION;');
    try {
        if (!req.user?.id) {
            await db.run('ROLLBACK;');
            return res.status(401).send({ success: false, message: 'Unauthorized: User ID not available from token.' });
        }
        const player1Id = req.user.id;
        const { player2Id, winnerId, score } = req.body as {
            player2Id: number;
            winnerId: number;
            score: string;
        };

        if (!player2Id || !winnerId || !score) {
            await db.run('ROLLBACK;');
            return res.status(400).send({
                success: false,
                message: 'Missing match data: player2Id, winnerId, and score are required.',
            });
        }

        const scoreParts = score.split('-');
        if (scoreParts.length !== 2) {
            await db.run('ROLLBACK;');
            return res.status(400).send({
                success: false,
                message: 'Invalid score format. Use "number-number", e.g., "10-8"',
            });
        }

        const [player1Score, player2Score] = scoreParts.map(Number);
        if (isNaN(player1Score) || isNaN(player2Score)) {
            await db.run('ROLLBACK;');
            return res.status(400).send({
                success: false,
                message: 'Score must contain valid numbers.',
            });
        }

        if (![player1Id, player2Id].includes(winnerId)) {
            await db.run('ROLLBACK;');
            return res.status(400).send({
                success: false,
                message: 'Winner ID must match one of the players.',
            });
        }
        const player1 = await User._findByIdRaw(player1Id);
        const player2 = await User._findByIdRaw(player2Id);
        const player2Data = await User._findByIdRaw(player2Id);
        const player2NameFromDb = player2Data?.name;

        if (!player1 || !player2) {
            await db.run('ROLLBACK;');
            return res.status(404).send({
                success: false,
                message: 'One or both players not found.',
            });
        }
        const match = await Match.create({
            player1Id,
            player2Id,
            winnerId,
            player1Score,
            player2Score,
            playedAt: new Date().toISOString(),
        });

        if (!match.id) {
            await db.run('ROLLBACK;');
            return res.status(500).send({
                success: false,
                message: 'Failed to record match due to database issue.',
            });
        }
        let updatedPlayer1Wins = player1.wins ?? 0;
        let updatedPlayer1Losses = player1.losses ?? 0;
        let updatedPlayer2Wins = player2.wins ?? 0;
        let updatedPlayer2Losses = player2.losses ?? 0;

        if (winnerId === player1Id) {
            updatedPlayer1Wins += 1;
            updatedPlayer2Losses += 1;
        } else {
            updatedPlayer2Wins += 1;
            updatedPlayer1Losses += 1;
        }

        const player1Updated = await User.update(player1Id, {
            wins: updatedPlayer1Wins,
            losses: updatedPlayer1Losses,
        });

        const player2Updated = await User.update(player2Id, {
            wins: updatedPlayer2Wins,
            losses: updatedPlayer2Losses,
        });

        if (!player1Updated || !player2Updated) {
            await db.run('ROLLBACK;');
            return res.status(500).send({
                success: false,
                message: 'Failed to update player stats.',
            });
        }
        
        await db.run('COMMIT;');
        return res.status(201).send({
            success: true,
            message: 'Match recorded successfully',
            data: match,
        });
    } catch (error) {
        await db.run('ROLLBACK;');
        console.error('Error recording match:', error);
        return res.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
};

export const recordMatchServer = async (req: FastifyRequest, res: FastifyReply) => {
    console.log('User service: Incoming request body for recordMatch:', req.body);
    const db = getDb();
    await db.run('BEGIN TRANSACTION;');
    try {
        const { player1Id, player2Id, winnerId, score } = req.body as {
            player1Id: number
            player2Id: number;
            winnerId: number;
            score: string;
        };

        if (!player2Id || !winnerId || !score) {
            await db.run('ROLLBACK;');
            return res.status(400).send({
                success: false,
                message: 'Missing match data: player2Id, winnerId, and score are required.',
            });
        }

        const scoreParts = score.split('-');
        if (scoreParts.length !== 2) {
            await db.run('ROLLBACK;');
            return res.status(400).send({
                success: false,
                message: 'Invalid score format. Use "number-number", e.g., "10-8"',
            });
        }

        const [player1Score, player2Score] = scoreParts.map(Number);
        if (isNaN(player1Score) || isNaN(player2Score)) {
            await db.run('ROLLBACK;');
            return res.status(400).send({
                success: false,
                message: 'Score must contain valid numbers.',
            });
        }

        if (![player1Id, player2Id].includes(winnerId)) {
            await db.run('ROLLBACK;');
            return res.status(400).send({
                success: false,
                message: 'Winner ID must match one of the players.',
            });
        }
        const player1 = await User._findByIdRaw(player1Id);
        const player2 = await User._findByIdRaw(player2Id);

        if (!player1 || !player2) {
            await db.run('ROLLBACK;');
            return res.status(404).send({
                success: false,
                message: 'One or both players not found.',
            });
        }
        const match = await Match.create({
            player1Id,
            player2Id,
            winnerId,
            player1Score,
            player2Score,
            playedAt: new Date().toISOString(),
        });

        if (!match.id) {
            await db.run('ROLLBACK;');
            return res.status(500).send({
                success: false,
                message: 'Failed to record match due to database issue.',
            });
        }

        let updatedPlayer1Wins = player1.wins ?? 0;
        let updatedPlayer1Losses = player1.losses ?? 0;
        let updatedPlayer2Wins = player2.wins ?? 0;
        let updatedPlayer2Losses = player2.losses ?? 0;

        if (winnerId === player1Id) {
            updatedPlayer1Wins += 1;
            updatedPlayer2Losses += 1;
        } else {
            updatedPlayer2Wins += 1;
            updatedPlayer1Losses += 1;
        }

        const player1Updated = await User.update(player1Id, {
            wins: updatedPlayer1Wins,
            losses: updatedPlayer1Losses,
        });

        const player2Updated = await User.update(player2Id, {
            wins: updatedPlayer2Wins,
            losses: updatedPlayer2Losses,
        });

        if (!player1Updated || !player2Updated) {
            await db.run('ROLLBACK;');
            return res.status(500).send({
                success: false,
                message: 'Failed to update player stats.',
            });
        }
        await db.run('COMMIT;');
        return res.status(201).send({
            success: true,
            message: 'Match recorded successfully',
            data: match,
        });
    } catch (error) {
        await db.run('ROLLBACK;');
        console.error('Error recording match:', error);
        return res.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
};

export const getCurrentUserMatches = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        if (!req.user?.id) {
            return res.status(401).send({ success: false, message: 'Unauthorized: User ID not available from token.' });
        }
        const userId = req.user.id;
        const rawMatches = await Match.findMatchesByPlayer(userId);
        const enhancedMatches = await Promise.all(rawMatches.map(async (match) => {
            let opponentId: number | null;
            let opponentName: string = 'Unknown Player';

            if (match.player1Id === userId) {
                opponentId = match.player2Id;
            } else {
                opponentId = match.player1Id;
            }
            
            if (opponentId !== null) {
                const opponentUser = await User._findByIdRaw(opponentId);
                if (opponentUser) {
                    opponentName = opponentUser.name;
                } else {
                    opponentName = 'Deleted User';
                }
            } else {
                opponentName = 'Former Dummy Opponent';
            }

            const isWinner = match.winnerId === userId;
            const actualWinnerName = match.winnerId === userId ? (await User._findByIdRaw(userId))?.name : (opponentId === null ? 'Former Dummy Winner' : opponentName);
            return {
                ...match,
                opponentId,
                opponentName,
                isWinner,
                actualWinnerName,
            };
        }));

        console.log("Retrieved Matches (Enhanced):", enhancedMatches);
        return res.status(200).send({
            success: true,
            message: 'Match history fetched successfully',
            data: enhancedMatches,
        });
    } catch (error) {
        console.error('Error fetching current user matches:', error);
        return res.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
};

export const getUserMatchHistory = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const { id } = req.params as { id: string };
        const userId = parseInt(id, 10);

        if (isNaN(userId)) {
            return res.status(400).send({
                success: false,
                message: 'Invalid user ID format.',
            });
        }
        const rawMatches = await Match.findMatchesByPlayer(userId);
        const enhancedMatches = await Promise.all(rawMatches.map(async (match) => {
            let opponentId: number | null;
            let opponentName: string = 'Unknown Player';

            if (match.player1Id === userId) {
                opponentId = match.player2Id;
            } else {
                opponentId = match.player1Id;
            }
            if (opponentId !== null) {
                const opponentUser = await User._findByIdRaw(opponentId);
                if (opponentUser) {
                    opponentName = opponentUser.name;
                } else {
                    opponentName = 'Deleted User';
                }
            } else {
                opponentName = 'Former Dummy Opponent';
            }

            const isWinner = match.winnerId === userId;
            const actualWinnerName = match.winnerId === userId ? (await User._findByIdRaw(userId))?.name : (opponentId === null ? 'Former Dummy Winner' : opponentName);
            return {
                ...match,
                opponentId,
                opponentName,
                isWinner,
                actualWinnerName,
            };
        }));

        return res.status(200).send({
            success: true,
            message: 'Match history fetched successfully',
            data: enhancedMatches,
        });

    } catch (error) {
        console.error('Error fetching user match history:', error);
        return res.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
};

export const getLeaderboard = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const users = await User.getLeaderboard();
        return res.status(200).send({
            success: true,
            message: 'Leaderboard fetched successfully',
            data: users,
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return res.status(500).send({
            success: false,
            message: (error as Error).message || 'Internal server error',
        });
    }
};

export const deleteCurrentUser = async (req: FastifyRequest, res: FastifyReply) => {
    const db = getDb();
    await db.run('BEGIN TRANSACTION;');
    try {
        if (!req.user || !req.user.id) {
            await db.run('ROLLBACK;');
            return res.status(401).send({ success: false, message: 'Unauthorized: User ID not available.' });
        }
        const userId = req.user.id;
        const userExists = await User._findByIdRaw(userId);
        if (!userExists) {
            await db.run('ROLLBACK;');
            return res.status(404).send({ success: false, message: 'User not found in User Service DB.' });
        }
        await Friendship.deleteFriendshipsByUser(userId);
        await Match.deleteMatchesByPlayer(userId);
        const userDeletedFromUserService = await User.delete(userId);
        if (!userDeletedFromUserService) {
            await db.run('ROLLBACK;');
            return res.status(500).send({ success: false, message: 'Failed to delete user account from User Service DB.' });
        }
        try {
            await axios.delete(`${AUTH_SERVICE_URL}/internal/auth-user/${userId}`, {});
            console.log(`Successfully requested auth user deletion for ID: ${userId}`);
        } catch (authServiceError: any) {
            console.error(`Error communicating with Auth Service to delete user ${userId}:`, authServiceError.message);
        }
        await db.run('COMMIT;');
        return res.status(200).send({
            success: true,
            message: 'User account and associated data deleted successfully across services.',
        });
    } catch (error: any) {
        await db.run('ROLLBACK;');
        console.error('Error deleting current user:', error);
        return res.status(error.statusCode || 500).send({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
};

export const deleteUserById = async (req: FastifyRequest, res: FastifyReply) => {
    const db = getDb();
    await db.run('BEGIN TRANSACTION;');

    try {
        const { id } = req.params as { id: string };
        const userId = parseInt(id, 10);

        if (isNaN(userId)) {
            await db.run('ROLLBACK;');
            return res.status(400).send({ success: false, message: 'Invalid user ID format.' });
        }

        const user = await User._findByIdRaw(userId);
        if (!user) {
            await db.run('ROLLBACK;');
            return res.status(404).send({ success: false, message: 'User not found.' });
        }

        await Friendship.deleteFriendshipsByUser(userId);
        console.log(`[UserService] Deleted friendships for user ID ${userId}.`);

        if (user.is_dummy) {
            console.log(`[UserService] User ID ${userId} is a dummy. Matches handled via DB constraints.`);
        } else {
            await Match.deleteMatchesByPlayer(userId);
            console.log(`[UserService] Deleted matches for user ID ${userId}.`);
        }

        const deleted = await User.delete(userId);
        if (!deleted) {
            await db.run('ROLLBACK;');
            return res.status(500).send({ success: false, message: 'Failed to delete user from database.' });
        }

        await db.run('COMMIT;');
        console.log(`[UserService] Successfully deleted user ID ${userId}.`);
        return res.status(200).send({
            success: true,
            message: `User ${userId} deleted successfully.`,
        });

    } catch (error: any) {
        await db.run('ROLLBACK;');
        console.error(`[UserService] Error deleting user ID:`, error);
        return res.status(500).send({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
};