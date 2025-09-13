import { io, Socket } from 'socket.io-client';

export interface GameInvitation {
    from: string;
    invitationId: string;
    message: string;
}

export interface GameStartEvent {
    roomName: string;
    opponent: string;
    message: string;
}

export class GameInvitationService {
    private socket: Socket | null = null;
    private onInvitationReceived: ((invitation: GameInvitation) => void) | null = null;
    private onGameStart: ((gameStart: GameStartEvent) => void) | null = null;
    private onInvitationResponse: ((response: any) => void) | null = null;

    constructor() {
        this.socket = null;
    }

    setSocket(socket: Socket) {
        this.socket = socket;
        
        this.socket.on('game-invitation', (invitation: GameInvitation) => {
            console.log('Received game invitation:', invitation);
            if (this.onInvitationReceived) {
                this.onInvitationReceived(invitation);
            }
        });

        this.socket.on('game-start', (gameStart: GameStartEvent) => {
            console.log('Game starting:', gameStart);
            if (this.onGameStart) {
                this.onGameStart(gameStart);
            }
        });

        this.socket.on('game-invitation-response', (response: any) => {
            console.log('Game invitation response:', response);
            if (this.onInvitationResponse) {
                this.onInvitationResponse(response);
            }
        });
    }

    connect(token: string) {
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io("/", {
            auth: { token }
        });

        this.socket.on('connect', () => {
            console.log('Connected to livechat server');
        });

        this.socket.on('game-invitation', (invitation: GameInvitation) => {
            console.log('Received game invitation:', invitation);
            if (this.onInvitationReceived) {
                this.onInvitationReceived(invitation);
            }
        });

        this.socket.on('game-start', (gameStart: GameStartEvent) => {
            console.log('Game starting:', gameStart);
            if (this.onGameStart) {
                this.onGameStart(gameStart);
            }
        });

        this.socket.on('game-invitation-response', (response: any) => {
            console.log('Game invitation response:', response);
            if (this.onInvitationResponse) {
                this.onInvitationResponse(response);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from livechat server');
        });
    }

    sendMessage(to: string, message: string) {
        if (this.socket) {
            this.socket.emit('emit-chat-message', { to, msg: message });
        }
    }

    setOnInvitationReceived(callback: (invitation: GameInvitation) => void) {
        this.onInvitationReceived = callback;
    }

    setOnGameStart(callback: (gameStart: GameStartEvent) => void) {
        this.onGameStart = callback;
    }

    setOnInvitationResponse(callback: (response: any) => void) {
        this.onInvitationResponse = callback;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const gameInvitationService = new GameInvitationService(); 