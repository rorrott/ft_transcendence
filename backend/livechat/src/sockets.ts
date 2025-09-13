import { Server, Socket } from "socket.io"
import { FastifyInstance } from "fastify"
import { sendMessageToSocket } from "./services/msgService"
import { getUserFromToken } from "./services/auth"
import { acceptGameInvitation, declineGameInvitation } from "./services/msgCmdServices"
import { gameService } from "./services/gameService"
import { runDbAsync } from "./databaseServices"

export const onlineUserSockets = new Map<string, { socket: Socket; userId: string }>

export async function initSockets(fastify: FastifyInstance)
{
    const io = new Server(fastify.server, {
        path: "/socket.io/",
        cors: 
        {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });
    io.on('connection', (socket: Socket) => {
        console.log("Connection received!");
        const token = socket.handshake.auth.token;
        let userId = ""
        let userName = ""
        try {
            const user: {userId: string, userName:string} = getUserFromToken(token);
            userId = user.userId
            userName = user.userName
            onlineUserSockets.set(userName, {socket: socket, userId: userId})
            console.log(userName + ' (' + onlineUserSockets.get(userId) + ') ' + 'connected');
            socket.join(userName);
            socket.on('disconnect', () => 
            {
                console.log(userName + ' (' + onlineUserSockets.get(userName) + ') ' + 'disconnected');
                onlineUserSockets.delete(userName)
                
                gameService.handlePlayerDisconnection(userName, io);
            })
            socket.on('emit-chat-message', async ({to, msg,toId}: {to: string, msg: string, toId: string}) => {
                let newTo = ""
                console.log(`TO ID: ${toId}`)
                for (const [key, { userId: existingUserId}] of onlineUserSockets.entries()) {
                    if (toId == existingUserId) {
                        console.log(`new to ${key}`)
                       newTo = key
                    }
                }

                console.log(userName + " " + to + " " + msg);
                try {
                    await sendMessageToSocket(io,userName,newTo,msg,userId)
                } catch (error) {
                    console.log(error)
                }

            });

            socket.on('accept-game-invitation', async ({invitationId}: {invitationId: string}) => {
                console.log(`${userName} accepting invitation ${invitationId}`);
                try {
                    const result = await acceptGameInvitation(invitationId, userName);
                    if (result.error) {
                        console.error('Error accepting invitation:', result.error);
                        return;
                    }
                    
                    const invitation = gameService.getInvitation(invitationId);
                    if (invitation) {
                        const otherUser = invitation.from === userName ? invitation.to : invitation.from;
                        const otherSocket = onlineUserSockets.get(otherUser)!.socket;
                        
                        if (otherSocket) {
                            io.to(otherSocket.id).emit('game-invitation-response', {
                                from: userName,
                                invitationId: invitationId,
                                accepted: true,
                                message: `${userName} accepted the game invitation!`
                            });
                        }
                        
                        const gameInfo = JSON.stringify({
                            type: 'accepted_game',
                            roomName: invitation.roomName,
                        });
                        await runDbAsync(`INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)`, 
                            [invitation.from, invitation.to,gameInfo]);
                        startGame(invitation.roomName, invitation.from, invitation.to, io);
                        // Start the multiplayer game
                        gameService.startGame(invitation.roomName, invitation.from, invitation.to, io);
                    }
                } catch (error) {
                    console.log(error);
                }
            });

            socket.on('decline-game-invitation', async ({invitationId}: {invitationId: string}) => {
                console.log(`${userName} declining invitation ${invitationId}`);
                try {
                    const result = await declineGameInvitation(invitationId, userName);
                    if (result.error) {
                        console.error('Error declining invitation:', result.error);
                        return;
                    }
                    
                    const invitation = gameService.getInvitation(invitationId);
                    if (invitation) {
                        const senderSocket = onlineUserSockets.get(invitation.from)!.socket;
                        if (senderSocket) {
                            io.to(senderSocket.id).emit('game-invitation-response', {
                                from: userName,
                                invitationId: invitationId,
                                accepted: false,
                                message: `${userName} declined the game invitation.`
                            });
                        }
                    }
                } catch (error) {
                    console.log(error);
                }
            });

            socket.on('join-game-room', ({ roomName }: { roomName: string }) => {
                console.log(`${userName} attempting to join game room ${roomName}`);
                
                if (!gameService.isPlayerAuthorizedForRoom(userName, roomName)) {
                    console.log(`Unauthorized access attempt: ${userName} tried to join room ${roomName}`);
                    socket.emit('game-access-denied', {
                        message: 'You are not authorized to join this game room.'
                    });
                    return;
                }
                
                console.log(`${userName} authorized to join game room ${roomName}`);
                socket.join(roomName);
                
                const gameState = gameService.getGameState(roomName);
                if (gameState) {
                    socket.emit('game-state-update', gameState);
                }
            });

            socket.on('player-input', ({ roomName, key, pressed }: { roomName: string; key: string; pressed: boolean }) => {
                if (!gameService.isPlayerAuthorizedForRoom(userName, roomName)) {
                    console.log(`Unauthorized input attempt: ${userName} tried to send input to room ${roomName}`);
                    return;
                }
                
                console.log(`${userName} input in room ${roomName}: ${key} ${pressed ? 'pressed' : 'released'}`);
                console.log(`Player ${userName} sending input: ${key} = ${pressed}`);
                gameService.updatePlayerInput(roomName, userName, key, pressed);
            });

            socket.on('request-game-state', ({ roomName }: { roomName: string }) => {
                if (!gameService.isPlayerAuthorizedForRoom(userName, roomName)) {
                    console.log(`Unauthorized state request: ${userName} tried to get state for room ${roomName}`);
                    return;
                }
                
                const gameState = gameService.getGameState(roomName);
                if (gameState) {
                    socket.emit('game-state-update', gameState);
                }
            });

            socket.on('leave-game-room', ({ roomName }: { roomName: string }) => {
                console.log(`${userName} leaving game room ${roomName}`);
                socket.leave(roomName);
                
                gameService.removePlayerFromRoom(roomName, userName, io);
            });

            socket.on('request-player-position', ({ roomName }: { roomName: string }) => {
                if (!gameService.isPlayerAuthorizedForRoom(userName, roomName)) {
                    console.log(`Unauthorized position request: ${userName} tried to get position for room ${roomName}`);
                    return;
                }
                
                console.log(`${userName} requesting player position for room ${roomName}`);
                const gameState = gameService.getGameState(roomName);
                if (gameState) {
                    const isLeftPlayer = userName === gameState.player1;
                    socket.emit('player-position', { isLeftPlayer });
                    console.log(`${userName} is ${isLeftPlayer ? 'left' : 'right'} player`);
                }
            });
        } catch (error) {
            console.log(error)
        }
    });
}

async function startGame(roomName: string, player1: string, player2: string, io: Server) {
    try {
        const player1Socket = onlineUserSockets.get(player1)!.socket;
        const player2Socket = onlineUserSockets.get(player2)!.socket;
        
        if (player1Socket) {
            io.to(player1Socket.id).emit('game-start', {
                roomName: roomName,
                opponent: player2,
                message: `Game starting! Room: ${roomName}`
            });
        }
        
        if (player2Socket) {
            io.to(player2Socket.id).emit('game-start', {
                roomName: roomName,
                opponent: player1,
                message: `Game starting! Room: ${roomName}`
            });
        }
        
        console.log(`Game started in room ${roomName} between ${player1} and ${player2}`);
    } catch (error) {
        console.error('Failed to start game:', error);
    }
}