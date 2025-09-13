import { Server, Socket } from "socket.io";
import { onlineUserSockets } from "../sockets";
import { JWT_SECRET } from "../config/config";
import jwt from 'jsonwebtoken';
export interface GameInvitation {
    id: string;
    from: string;
    to: string;
    roomName: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    createdAt: Date;
}

export interface GameState {
    ball: {
        x: number;
        y: number;
        dx: number;
        dy: number;
        speed: number;
    };
    leftPaddle: {
        y: number;
    };
    rightPaddle: {
        y: number;
    };
    score: [number, number];
    gameStarted: boolean;
    gameEnded: boolean;
    winner: string | null;
    lastUpdate: number;
    player1: string;
    player2: string;
}

class GameService {
    private invitations: Map<string, GameInvitation> = new Map();
    private activeGames: Map<string, GameState> = new Map();
    private gameRooms: Map<string, Set<string>> = new Map(); // roomName -> Set of player usernames
    private gameLoops: Map<string, NodeJS.Timeout> = new Map(); // roomName -> game loop interval
    private playerInputs: Map<string, { [playerId: string]: { w: boolean; s: boolean; Up: boolean; Down: boolean } }> = new Map();

    constructor() {
        setInterval(() => this.cleanupExpiredInvitations(), 5 * 60 * 1000);
    }

    async createGameInvitation(from: string, to: string): Promise<GameInvitation> {
        
        if (!onlineUserSockets.has(to)) {
            throw new Error("User is not online");
        }

        if (this.isPlayerInGame(from)) {
            throw new Error("You are already in a game. Please finish your current game before sending new invitations.");
        }

        if (this.isPlayerInGame(to)) {
            throw new Error("The target player is already in a game. Please wait for them to finish.");
        }

        for (const invitation of this.invitations.values()) {
            if (invitation.from === from && invitation.to === to && invitation.status === 'pending') {
                throw new Error("You already have a pending invitation with this user");
            }
        }

        const roomName = this.generateRoomName();
        
        const invitation: GameInvitation = {
            id: this.generateInvitationId(),
            from,
            to,
            roomName,
            status: 'pending',
            createdAt: new Date()
        };

        this.invitations.set(invitation.id, invitation);
        console.log(`Created invitation:`, invitation);
        return invitation;
    }

    private generateRoomName(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let roomName = '';
        for (let i = 0; i < 8; i++) {
            roomName += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return roomName;
    }

    private generateInvitationId(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    getInvitation(invitationId: string): GameInvitation | undefined {
        console.log(`Looking for invitation: ${invitationId}`);
        console.log(`Available invitations:`, Array.from(this.invitations.keys()));
        return this.invitations.get(invitationId);
    }

    getInvitationsForUser(username: string): GameInvitation[] {
        return Array.from(this.invitations.values()).filter(
            inv => (inv.from === username || inv.to === username) && inv.status === 'pending'
        );
    }

    async acceptInvitation(invitationId: string, username: string): Promise<GameInvitation> {
        const invitation = this.invitations.get(invitationId);
        if (!invitation) {
            throw new Error("Invitation not found");
        }

        if (invitation.to !== username) {
            throw new Error("You can only accept invitations sent to you");
        }

        if (invitation.status !== 'pending') {
            throw new Error("Invitation is no longer pending");
        }

        invitation.status = 'accepted';
        
        if (!this.gameRooms.has(invitation.roomName)) {
            this.gameRooms.set(invitation.roomName, new Set());
        }
        this.gameRooms.get(invitation.roomName)!.add(invitation.from);
        this.gameRooms.get(invitation.roomName)!.add(invitation.to);

        return invitation;
    }

    async declineInvitation(invitationId: string, username: string): Promise<GameInvitation> {
        const invitation = this.invitations.get(invitationId);
        if (!invitation) {
            throw new Error("Invitation not found");
        }

        if (invitation.to !== username) {
            throw new Error("You can only decline invitations sent to you");
        }

        invitation.status = 'declined';
        return invitation;
    }

    startGame(roomName: string, player1: string, player2: string, io?: Server): void {
        console.log(`Starting multiplayer game in room ${roomName} with players ${player1} and ${player2}`);
        
        const canvasWidth = 1000;
        const canvasHeight = 600;
        const paddleWidth = 10;
        const paddleHeight = 90;
        const border = 5;
        
        const gameState: GameState = {
            ball: {
                x: canvasWidth / 2, 
                y: canvasHeight / 2, 
                dx: Math.floor(Math.random() * 2) ? -1 : 1,
                dy: 0,
                speed: 7
            },
            leftPaddle: { y: canvasHeight / 2 - paddleHeight / 2 },
            rightPaddle: { y: canvasHeight / 2 - paddleHeight / 2 },
            score: [0, 0],
            gameStarted: true,
            gameEnded: false,
            winner: null,
            lastUpdate: Date.now(),
            player1: player1,
            player2: player2
        };

        this.activeGames.set(roomName, gameState);
        this.playerInputs.set(roomName, {
            [player1]: { w: false, s: false, Up: false, Down: false },
            [player2]: { w: false, s: false, Up: false, Down: false }
        });

        const gameLoop = setInterval(() => {
            this.updateGame(roomName);
            if (io) {
                io.to(roomName).emit('game-state-update', gameState);
            }
        }, 16);

        this.gameLoops.set(roomName, gameLoop);
    }

    private async updateGame(roomName: string): Promise<void> {
        const gameState = this.activeGames.get(roomName);
        if (!gameState || gameState.gameEnded) return;

        const inputs = this.playerInputs.get(roomName);
        if (!inputs) return;

        const player1 = gameState.player1;
        const player2 = gameState.player2;
        const player1Inputs = inputs[player1];
        const player2Inputs = inputs[player2];

        const canvasWidth = 1000;
        const canvasHeight = 600;
        const paddleWidth = 10;
        const paddleHeight = 90;
        const border = 5;
        const ballRadius = 5;

        if (player1Inputs) {
            if (player1Inputs.w) {
                gameState.leftPaddle.y = Math.max(border, gameState.leftPaddle.y - 10);
                console.log(`Left paddle moved up: ${gameState.leftPaddle.y}`);
            }
            if (player1Inputs.s) {
                gameState.leftPaddle.y = Math.min(canvasHeight - paddleHeight - border, gameState.leftPaddle.y + 10);
                console.log(`Left paddle moved down: ${gameState.leftPaddle.y}`);
            }
        }

        if (player2Inputs) {
            if (player2Inputs.Up) {
                gameState.rightPaddle.y = Math.max(border, gameState.rightPaddle.y - 10);
                console.log(`Right paddle moved up: ${gameState.rightPaddle.y}`);
            }
            if (player2Inputs.Down) {
                gameState.rightPaddle.y = Math.min(canvasHeight - paddleHeight - border, gameState.rightPaddle.y + 10);
                console.log(`Right paddle moved down: ${gameState.rightPaddle.y}`);
            }
        }

        gameState.ball.x += gameState.ball.dx * gameState.ball.speed;
        gameState.ball.y += gameState.ball.dy * gameState.ball.speed;

        if (gameState.ball.y <= ballRadius || gameState.ball.y >= canvasHeight - ballRadius) {
            gameState.ball.dy = -gameState.ball.dy;
        }

        const leftPaddleX = border;
        const rightPaddleX = canvasWidth - paddleWidth - border;

        if (gameState.ball.x <= leftPaddleX + paddleWidth + ballRadius && 
            gameState.ball.x >= leftPaddleX - ballRadius &&
            gameState.ball.y >= gameState.leftPaddle.y - ballRadius && 
            gameState.ball.y <= gameState.leftPaddle.y + paddleHeight + ballRadius) {
            gameState.ball.dx = -gameState.ball.dx;
            gameState.ball.dy = (gameState.ball.y - (gameState.leftPaddle.y + paddleHeight / 2)) / (paddleHeight / 2);
        }

        if (gameState.ball.x >= rightPaddleX - ballRadius && 
            gameState.ball.x <= rightPaddleX + paddleWidth + ballRadius &&
            gameState.ball.y >= gameState.rightPaddle.y - ballRadius && 
            gameState.ball.y <= gameState.rightPaddle.y + paddleHeight + ballRadius) {
            gameState.ball.dx = -gameState.ball.dx;
            gameState.ball.dy = (gameState.ball.y - (gameState.rightPaddle.y + paddleHeight / 2)) / (paddleHeight / 2);
        }

        if (gameState.ball.x <= 0) {
            gameState.score[1]++;
            this.resetBall(gameState);
        } else if (gameState.ball.x >= canvasWidth) {
            gameState.score[0]++;
            this.resetBall(gameState);
        }

        if (gameState.score[0] >= 5 || gameState.score[1] >= 5) {
            gameState.gameEnded = true;
            gameState.winner = gameState.score[0] >= 5 ? player1 : player2;
   
        try {
              const response = await fetch("http://user-service:5501/api/v1/user/matches/server", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    player1Id:onlineUserSockets.get(player1)!.userId,
                    player2Id:onlineUserSockets.get(player2)!.userId,
                    winnerId:onlineUserSockets.get(gameState.winner)!.userId,
                    score: `${gameState?.score[0]}-${gameState?.score[1]}`
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.log(errorData.message)
                throw new Error(errorData.message || "Failed to send match result due to server error.");
            }
            this.endGame(roomName);
        } catch (error) {
            console.log(error)
        }

        }

        gameState.lastUpdate = Date.now();
    }

    private resetBall(gameState: GameState): void {
        gameState.ball.x = 1000 / 2; // canvasWidth / 2
        gameState.ball.y = 600 / 2; // canvasHeight / 2
        gameState.ball.dx = Math.floor(Math.random() * 2) ? -1 : 1;
        gameState.ball.dy = 0;
    }

    private async endGame(roomName: string): Promise<void> {
        console.log(`Ending game in room ${roomName}`);
        
        const gameLoop = this.gameLoops.get(roomName);
        if (gameLoop) {
            clearInterval(gameLoop);
            this.gameLoops.delete(roomName);
        }
        
        this.cleanupInvitationsForRoom(roomName);
        
        const gameState = this.activeGames.get(roomName);

        this.removeGameRoom(roomName);
        console.log(`Room ${roomName} cleaned up after game end`);
    }

    updatePlayerInput(roomName: string, playerId: string, key: string, pressed: boolean): void {
        console.log(`updatePlayerInput called: room=${roomName}, player=${playerId}, key=${key}, pressed=${pressed}`);
        const inputs = this.playerInputs.get(roomName);
        if (inputs && inputs[playerId]) {
            inputs[playerId][key as keyof typeof inputs[typeof playerId]] = pressed;
            console.log(`Updated input for ${playerId}: ${key} = ${pressed}`);
            console.log(`Current inputs for ${playerId}:`, inputs[playerId]);
        } else {
            console.log(`No inputs found for room ${roomName} or player ${playerId}`);
            console.log(`Available inputs:`, inputs);
        }
    }

    getGameState(roomName: string): GameState | undefined {
        return this.activeGames.get(roomName);
    }

    private cleanupExpiredInvitations() {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        for (const [id, invitation] of this.invitations.entries()) {
            if (invitation.status === 'pending' && invitation.createdAt < fiveMinutesAgo) {
                invitation.status = 'expired';
            }
        }
    }

    getGameRoom(roomName: string): Set<string> | undefined {
        return this.gameRooms.get(roomName);
    }

    isPlayerAuthorizedForRoom(playerName: string, roomName: string): boolean {
        const gameState = this.activeGames.get(roomName);
        if (!gameState) {
            return false;
        }
        
        return gameState.player1 === playerName || gameState.player2 === playerName;
    }

    isPlayerInGameRoom(playerName: string): boolean {
        for (const room of this.gameRooms.values()) {
            if (room.has(playerName)) {
                return true;
            }
        }
        return false;
    }

    isPlayerInGame(playerName: string): boolean {
        if (this.isPlayerInGameRoom(playerName)) {
            return true;
        }
        
        for (const invitation of this.invitations.values()) {
            if ((invitation.from === playerName || invitation.to === playerName) && invitation.status === 'pending') {
                return true;
            }
        }
        
        return false;
    }

    getPlayerRoomName(playerName: string): string | null {
        for (const [roomName, room] of this.gameRooms.entries()) {
            if (room.has(playerName)) {
                return roomName;
            }
        }
        return null;
    }

    removePlayerFromRoom(roomName: string, playerName: string, io?: Server): void {
        const room = this.gameRooms.get(roomName);
        if (room) {
            room.delete(playerName);
            console.log(`Removed ${playerName} from room ${roomName}. Players remaining: ${room.size}`);
            
            if (room.size === 0) {
                console.log(`Room ${roomName} is now empty, cleaning up...`);
                this.removeGameRoom(roomName);
            } else {
                const gameState = this.activeGames.get(roomName);
                if (gameState && !gameState.gameEnded) {
                    const remainingPlayer = room.size > 0 ? Array.from(room)[0] : null;
                    if (remainingPlayer) {
                        gameState.gameEnded = true;
                        gameState.winner = remainingPlayer;
                        
                        console.log(`Game ended due to player leaving. Winner: ${remainingPlayer}`);
                        
                        if (io) {
                            io.to(roomName).emit('game-end', {
                                winner: remainingPlayer,
                                reason: 'player_left',
                                message: `${playerName} left the game. ${remainingPlayer} wins!`
                            });
                        }
                        
                        this.removeGameRoom(roomName);
                    }
                }
            }
        }
    }

    removeGameRoom(roomName: string) {
        this.gameRooms.delete(roomName);
        this.activeGames.delete(roomName);
        this.playerInputs.delete(roomName);
        
        const gameLoop = this.gameLoops.get(roomName);
        if (gameLoop) {
            clearInterval(gameLoop);
            this.gameLoops.delete(roomName);
        }
        
        this.cleanupInvitationsForRoom(roomName);
    }

    removeInvitation(invitationId: string) {
        this.invitations.delete(invitationId);
    }

    private cleanupInvitationsForRoom(roomName: string) {
        for (const [id, invitation] of this.invitations.entries()) {
            if (invitation.roomName === roomName) {
                this.invitations.delete(id);
                console.log(`Cleaned up invitation ${id} for room ${roomName}`);
            }
        }
    }

    handlePlayerDisconnection(disconnectedPlayer: string, io?: Server): void {
        console.log(`Player ${disconnectedPlayer} disconnected, checking for active games...`);
        
        for (const [roomName, room] of this.gameRooms.entries()) {
            if (room.has(disconnectedPlayer)) {
                console.log(`Found disconnected player ${disconnectedPlayer} in room ${roomName}`);
                
                const gameState = this.activeGames.get(roomName);
                if (gameState && !gameState.gameEnded) {
                    const winner = gameState.player1 === disconnectedPlayer ? gameState.player2 : gameState.player1;
                    
                    gameState.gameEnded = true;
                    gameState.winner = winner;
                    
                    console.log(`Game ended due to disconnection. Winner: ${winner}`);
                    
                    if (io) {
                        io.to(roomName).emit('game-end', {
                            winner: winner,
                            reason: 'disconnection',
                            message: `${disconnectedPlayer} disconnected. ${winner} wins!`
                        });
                    }
                    
                    this.removeGameRoom(roomName);
                }
                break;
            }
        }
    }
}

export const gameService = new GameService(); 