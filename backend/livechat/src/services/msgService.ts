import { Server, Socket } from "socket.io";
import { runDbAsync } from "../databaseServices";
import { CommandResult } from "../interfaces/types"
import { blockUser, msgCmdCheck, unblockUser } from "./msgCmdServices"
import { isBlocked } from "./databaseService";
import { onlineUserSockets } from "../sockets";
import { gameService } from "./gameService";


export async function sendMessageToSocket(io: Server, userName: string, to: string, msg: string, fromId: string)
{
    console.log(`sendMessageToSocket called: userName="${userName}", to="${to}", msg="${msg}"`);
    const targetSocket: Socket | undefined = onlineUserSockets.get(to)?.socket;
    const isBlock = await isBlocked(userName, to)
    console.log(`Target socket exists: ${!!targetSocket}, isBlocked: ${isBlock}`);
    
    if (targetSocket)
    {
        const cmdResult: CommandResult = await msgCmdCheck(msg,userName,to)
        console.log(`Command result:`, cmdResult);
        
        if (isBlock)
            return
        if (cmdResult.error)
        {
            console.error("there is an error");
            console.log(cmdResult.error);
            const senderSocket = onlineUserSockets.get(userName)!.socket;
            if (senderSocket) {
                io.to(senderSocket.id).emit('invitation-error', {
                message: cmdResult.replyMessage
            });
        }
            throw cmdResult.error;
        }
        if (!cmdResult.isCommand)
        {
            io.to(targetSocket.id).emit('get-chat-message', {
            from: userName,
            msg: msg,
            fromId: fromId
            });

            console.log(` from: ${userName},
            msg: ${msg},
            fromId: ${fromId}`)
        }
        else
        {
            console.log(`Processing command: ${msg}`);
            if (msg.startsWith('/invite')) {
                const isBlock = await isBlocked(userName, to)
                if (isBlock)
                    return
                if (cmdResult.error) {
                    const senderSocket = onlineUserSockets.get(userName)!.socket;
                    if (senderSocket) {
                        io.to(senderSocket.id).emit('invitation-error', {
                            message: cmdResult.replyMessage
                        });
                    }
                } else {
                    io.to(targetSocket.id).emit('game-invitation-with-buttons', {
                        from: userName,
                        invitationId: cmdResult.invitationId,
                        message: `${userName} invited you to play a game!`,
                        roomName: cmdResult.replyMessage.split('Room: ')[1] || 'Unknown Room',
                        fromId: fromId
                    });
                    
                    const senderSocket = onlineUserSockets.get(userName)!.socket;
                    if (senderSocket) {
                        io.to(senderSocket.id).emit('get-chat-message', {
                            from: 'System',
                            msg: cmdResult.replyMessage
                        });
                    }
                    
                    setTimeout(() => {
                        const invitation = gameService.getInvitation(cmdResult.invitationId!);
                        if (invitation && invitation.status === 'pending') {
                            gameService.removeInvitation(cmdResult.invitationId!);
                            console.log(`Auto-deleted invitation ${cmdResult.invitationId} after 5 seconds`);
                            
                            const targetSocket = onlineUserSockets.get(to)!.socket;
                            const senderSocket = onlineUserSockets.get(userName)!.socket;
                            
                            if (targetSocket) {
                                io.to(targetSocket.id).emit('invitation-expired', {
                                    invitationId: cmdResult.invitationId,
                                    message: 'Game invitation expired'
                                });
                            }
                            
                            if (senderSocket) {
                                io.to(senderSocket.id).emit('get-chat-message', {
                                    from: 'System',
                                    msg: 'invitation expired'
                                });
                            }
                        }
                    }, 5000);
                }
            }
            else {
                const senderSocket = onlineUserSockets.get(userName)!.socket;
                if (senderSocket) {
                    io.to(senderSocket.id).emit('get-chat-message', {
                        from: 'System',
                        msg: cmdResult.replyMessage
                    });
                }
            }
        }
    }
        try {
        await runDbAsync(`INSERT INTO messages (sender_id, receiver_id, message)
                        VALUES (?, ?, ?)`,[userName,to,msg]);
        console.log("Message stored in DB");
        }   catch (err) {
        console.error("Failed to insert message:", err);
        throw err
    }
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
