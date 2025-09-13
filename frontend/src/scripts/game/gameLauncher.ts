import { initCanvas, setAnimationId, gameStates, keys, ball, leftPaddle, rightPaddle, animationId, match, setMatch } from "./state.js";
import { renderGame } from "./render.js";
import { navigateTo } from "../main.js";
import { io, Socket } from "socket.io-client";
import { Match } from "./match.js";

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

export class GameLauncher {
    private socket: Socket | null = null;
    private roomName: string | null = null;
    private playerIndex: number | null = null;
    private gameStarted: boolean = false;
    private onGameEnd: ((winner: string) => void) | null = null;
    private isMultiplayer: boolean = false;
    private lastGameState: GameState | null = null;
    private isLeftPlayer: boolean = false; // true if this player controls left paddle

    constructor() {
        this.setupEventListeners();
    }

    private setupEventListeners() {
        window.addEventListener("keydown", (event) => {
            if (event.key === "ArrowUp" || event.key === "ArrowDown")
                event.preventDefault();
            if (event.key === "Escape") {
                this.cleanup();
                navigateTo("/");
            }
            if (this.gameStarted) {
                // Left player (W/S keys)
                if (this.isLeftPlayer) {
                    if (event.key === "w") {
                        keys.w = true;
                        this.sendKeyPress("w", true);
                    }
                    if (event.key === "s") {
                        keys.s = true;
                        this.sendKeyPress("s", true);
                    }
                }
                // Right player (Arrow keys)
                else {
                    if (event.key === "ArrowUp") {
                        console.log("Right player pressing ArrowUp");
                        keys.Up = true;
                        this.sendKeyPress("Up", true);
                    }
                    if (event.key === "ArrowDown") {
                        console.log("Right player pressing ArrowDown");
                        keys.Down = true;
                        this.sendKeyPress("Down", true);
                    }
                }
            }
        });

        window.addEventListener("keyup", (event) => {
            if (this.gameStarted) {
                // Left player (W/S keys)
                if (this.isLeftPlayer) {
                    if (event.key === "w") {
                        keys.w = false;
                        this.sendKeyPress("w", false);
                    }
                    if (event.key === "s") {
                        keys.s = false;
                        this.sendKeyPress("s", false);
                    }
                }
                // Right player (Arrow keys)
                else {
                    if (event.key === "ArrowUp") {
                        keys.Up = false;
                        this.sendKeyPress("Up", false);
                    }
                    if (event.key === "ArrowDown") {
                        keys.Down = false;
                        this.sendKeyPress("Down", false);
                    }
                }
            }
        });
    }

    async startGame(roomName: string): Promise<void> {
        this.roomName = roomName;
        this.isMultiplayer = true;
        
        console.log(`Starting multiplayer game in room: ${roomName}`);
        
        await this.connectToMultiplayer();
        
        this.initializeGame();
        
        if (this.socket) {
            this.socket.emit('join-game-room', { roomName });
            
            this.socket.emit('request-player-position', { roomName });
        }
    }

    private async connectToMultiplayer(): Promise<void> {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("No authentication token found");
        }

        this.socket = io("/", {
            auth: {
                token: token,
            },
        });

        this.socket.on('game-state-update', (gameState: GameState) => {
            this.updateGameState(gameState);
        });

        this.socket.on('game-end', ({ winner, reason, message }: { winner: string; reason?: string; message?: string }) => {
            
            if (reason === 'disconnection') {
                this.endGameWithDisconnection(winner, message || `${winner} wins due to opponent disconnection!`);
            } else if (reason === 'player_left') {
                this.endGameWithDisconnection(winner, message || `${winner} wins because opponent left the game!`);
            } else {
                this.endGame(winner);
            }
        });

        this.socket.on('game-access-denied', ({ message }: { message: string }) => {
            console.log('Access denied to game room:', message);
            alert(`Access Denied: ${message}`);
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        });

        this.socket.on('player-position', ({ isLeftPlayer }: { isLeftPlayer: boolean }) => {
            console.log(`Player position: ${isLeftPlayer ? 'left' : 'right'}`);
            console.log(`This player will use ${isLeftPlayer ? 'W/S keys' : 'Arrow keys'}`);
            this.isLeftPlayer = isLeftPlayer;
        });

        return new Promise((resolve, reject) => {
            if (this.socket) {
                this.socket.on('connect', () => {
                    console.log('Connected to multiplayer server');
                    resolve();
                });
                
                this.socket.on('connect_error', (error: any) => {
                    console.error('Failed to connect to multiplayer server:', error);
                    reject(error);
                });
            }
        });
    }

    private initializeGame() {
        initCanvas();
        
        gameStates.isIntro = false;
        gameStates.isRunning = false;
        gameStates.isEnd = false;
        gameStates.isFirstUpdate = true;
        
        keys.w = false;
        keys.s = false;
        keys.Up = false;
        keys.Down = false;
        
        ball.init();
        leftPaddle.init(true);
        rightPaddle.init(false);
        
        const tempMatch = new Match(1, "Player 1", "Player 2");
        setMatch(tempMatch);
    }

    private sendKeyPress(key: string, pressed: boolean) {
        console.log(`sendKeyPress: ${key} = ${pressed}, room: ${this.roomName}, isLeftPlayer: ${this.isLeftPlayer}`);
        if (this.socket && this.roomName) {
            this.socket.emit('player-input', {
                roomName: this.roomName,
                key: key,
                pressed: pressed
            });
        } else {
            console.log("Cannot send key press - socket or roomName not available");
        }
    }

    private updateGameState(gameState: GameState) {
        this.lastGameState = gameState;
        
        ball.x = gameState.ball.x;
        ball.y = gameState.ball.y;
        ball.dx = gameState.ball.dx;
        ball.dy = gameState.ball.dy;
        ball.speed = gameState.ball.speed;
        
        leftPaddle.y = gameState.leftPaddle.y;
        rightPaddle.y = gameState.rightPaddle.y;
        
        if (match) {
            match.score = gameState.score;
            match.player1 = gameState.player1;
            match.player2 = gameState.player2;
        }
        
        if (gameState.gameEnded && gameState.winner) {
            console.log('Game ended, winner:', gameState.winner);
            this.endGame(gameState.winner);
        }
 
        if (!this.gameStarted) {
            console.log('Starting game loop');
            this.startGameLoop();
        }
    }

    private startGameLoop() {
        this.gameStarted = true;
        gameStates.isRunning = true;
        gameStates.isIntro = false;
        gameStates.isEnd = false;
        this.gameLoop();
    }

    private gameLoop() {
        if (!gameStates.isRunning || gameStates.isEnd) {
            setAnimationId(null);
            return;
        }
        
        renderGame();
        
        setAnimationId(requestAnimationFrame(() => this.gameLoop()));
    }

    private async endGame(winner: string) {
        gameStates.isRunning = false;
        gameStates.isEnd = true;

        this.cleanup();
        
        setTimeout(() => {
            this.renderEndScreen(winner);
        }, 50);
    }

    private endGameWithDisconnection(winner: string, message: string) {
        gameStates.isRunning = false;
        gameStates.isEnd = true;
        this.cleanup();
        
        setTimeout(() => {
            this.renderDisconnectionEndScreen(winner, message);
        }, 50);
    }

    private renderEndScreen(winner: string) {
        const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "white";
        ctx.font = "48px 'Press Start 2P', cursive";
        ctx.textAlign = "center";
        ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.font = "24px 'Press Start 2P', cursive";
        ctx.fillText(`Winner: ${winner}`, canvas.width / 2, canvas.height / 2);
        
        ctx.font = "18px 'Press Start 2P', cursive";
        ctx.fillText("Press ESC to return to menu", canvas.width / 2, canvas.height / 2 + 50);
    }

    private renderDisconnectionEndScreen(winner: string, message: string) {
        const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;


        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "white";
        ctx.font = "48px 'Press Start 2P', cursive";
        ctx.textAlign = "center";
        ctx.fillText("Game Ended", canvas.width / 2, canvas.height / 2 - 80);
        
        ctx.font = "24px 'Press Start 2P', cursive";
        ctx.fillText(`Winner: ${winner}`, canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.font = "18px 'Press Start 2P', cursive";
        ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 10);
        
        ctx.font = "16px 'Press Start 2P', cursive";
        ctx.fillText("Press ESC to return to menu", canvas.width / 2, canvas.height / 2 + 50);
    }

    private cleanup() {
        if (this.socket && this.roomName) {
            this.socket.emit('leave-game-room', { roomName: this.roomName });
        }
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        if (animationId) {
            cancelAnimationFrame(animationId);
            setAnimationId(null);
        }
    }

    setOnGameEnd(callback: (winner: string) => void) {
        this.onGameEnd = callback;
    }
}

export const gameLauncher = new GameLauncher(); 