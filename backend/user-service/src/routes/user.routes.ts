import { FastifyInstance } from 'fastify';
import { localOpponentQuery } from '../types/fastify.js';

import { currentUser, updateCurrentUserName,
        onlineStatus, uploadAvatar, addFriend, 
        getFriendsList, recordMatch, getCurrentUserMatches,
        getUserMatchHistory, getLeaderboard,
        recordMatchServer
} from "../controllers/session.controller.js";

import { createUser } from '../controllers/user.controllers.js';
import { authorize } from '../middleware/auth.middleware.js';
import { deleteCurrentUser, acceptFriendRequest, getAllUsers,
         localOpponent, deleteUserById } from '../controllers/session.controller.js';

interface UpdateUserRoute {
  Body: {
    name: string;
  };
}

async function userRoutes(fastify: FastifyInstance) {
    fastify.post('/', createUser);    
    fastify.get('/me', { preHandler: authorize }, currentUser);
    fastify.get<{Querystring: localOpponentQuery}>('/dummy', { preHandler: authorize }, localOpponent);
    fastify.get('/users', { preHandler: authorize }, getAllUsers);
    fastify.put<UpdateUserRoute>('/me', { preHandler: authorize }, updateCurrentUserName);
    fastify.post('/me/avatar', { preHandler: authorize }, uploadAvatar);
    fastify.get('/me/status', { preHandler: authorize }, onlineStatus);  
    fastify.post('/me/friends', { preHandler: authorize }, addFriend);
    fastify.post('/me/friends/accept', { preHandler: authorize }, acceptFriendRequest);
    fastify.get('/me/friends', { preHandler: authorize }, getFriendsList);
    fastify.post('/matches', { preHandler: authorize }, recordMatch);
    fastify.post('/matches/server',recordMatchServer);
    fastify.get('/me/matches', { preHandler: authorize }, getCurrentUserMatches);
    fastify.get('/:id/matches', { preHandler: authorize }, getUserMatchHistory);
    fastify.get('/leaderboard', { preHandler: authorize }, getLeaderboard);
    fastify.delete('/me', { preHandler: authorize }, deleteCurrentUser);
    fastify.delete('/user/:id', { preHandler: [authorize]}, deleteUserById);
}

export default userRoutes;