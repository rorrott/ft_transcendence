import { navigateTo } from "../main.js";
import { gameLauncher } from "../game/gameLauncher.js";

export class OnlineGameView {
    private roomName: string | null = null;

    constructor(roomName?: string) {
        this.roomName = roomName || null;
    }

    async getHtml() {
        return `
                     <div class="flex flex-col items-center justify-center min-h-screen bg-gray-900">
                <div class="text-center mb-8">
                    <h1 class="text-4xl font-bold text-white mb-4">Online Multiplayer Game</h1>
                    <p class="text-gray-300 mb-2">Room: ${this.roomName || 'Connecting...'}</p>
                </div>
                
                <div class="relative">
                    <canvas id="gameCanvas" class="border-2 border-white rounded-lg"></canvas>
                    
                    <div id="waitingMessage" class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                        <div class="text-white text-center">
                            <p>Starting game...</p>
                        </div>
                    </div>
                </div>
                
            </div>
        `;
    }

    async onMounted() {
        if (this.roomName) {
            const waitingMessage = document.getElementById("waitingMessage");
            if (waitingMessage) {
                setTimeout(() => {
                    waitingMessage.style.display = "none";
                }, 2000);
            }

            try {
                await gameLauncher.startGame(this.roomName);
            } catch (error) {
                console.error("Failed to start game:", error);
                alert("Failed to start game. Please try again.");
                navigateTo("/");
            }
        } else {
            alert("No room name provided");
            navigateTo("/");
        }
    }
} 