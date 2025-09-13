import { MAX_SCORE } from "./config.js";
import { setMatch, gameStates, animationId, setAnimationId } from "./state.js";
import { gameLoop, initGame } from "./game.js";
import { renderEndMenu, renderMatchIntro, renderPauseMenu } from "./render.js";

export class Match {
    winner: string | null = null;
    score: number[] = [0, 0];

    onEnd?: () => void;

    constructor(
        public gameMode: number,
        public player1: string,
        public player2: string
    ) {}

    start() {
        this.stop();
        setMatch(this);
        initGame();
        renderMatchIntro();
    }

    restart() {
        this.stop();
        this.winner = null;
        this.score = [0, 0];
        this.start();
    }

    pause() {
        gameStates.isRunning = !gameStates.isRunning;
        if (gameStates.isRunning)
            setAnimationId(requestAnimationFrame(gameLoop));
        else {
            this.stop();
            renderPauseMenu();
        }
    }

    end() {
        gameStates.isRunning = false;
        gameStates.isEnd = true;
        this.winner = this.score[0] === MAX_SCORE ? this.player1 : this.player2;
        this.stop();
        if (this.gameMode !== 2)
            setTimeout(() => {
                renderEndMenu();
            }, 50);
        
        if (!!localStorage.getItem("token") && this.gameMode !== 2)
            this.sendResult();
    
        if (this.onEnd) this.onEnd();
    }

    stop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            setAnimationId(null);
        }
    }

    updateScore(playerIndex: number) {
        this.score[playerIndex]++;
        if (this.score[playerIndex] === MAX_SCORE)
            this.end();
    }

    async sendResult() {
        const route = "/api/v1/user/matches";

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No authentication token found.");
                throw new Error("Authentication token is missing."); 
            }
            const payloadBase64 = token.split(".")[1];
            let player1Id: string | undefined;
            try {
                const payload = JSON.parse(atob(payloadBase64));
                player1Id = payload?.userId;                
                if (!player1Id) {
                    throw new Error("Player1 ID missing in token payload (expected 'userId').");
                }
            } catch (Err) {
                throw new Error("Invalid or malformed JWT token structure.");
            }

            let player2Id: string | null = null;
            const originalPlayer2Name = this.player2; 

            try {
                const userRes = await fetch(`/api/v1/user/dummy?username=${encodeURIComponent(originalPlayer2Name)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!userRes.ok) {
                    throw new Error("Player2 not found in database.");
                }
                const userData = await userRes.json();
                player2Id = userData?.data?.user?.id; 
                if (!player2Id) {
                    console.warn("Player2 found, but their ID is missing from user data. User data:", userData);
                    throw new Error("Player2 ID missing from lookup response.");
                }
            } catch (err) {
                console.warn(`Player '${originalPlayer2Name}' not found — trying to create dummy.`);
                const dummyRes = await fetch("/api/v1/user/dummy?username=${encodeURIComponent(originalPlayer2Name)}", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (!dummyRes.ok) {
                    const errorData = await dummyRes.json();
                    console.error("Failed to create dummy user:", errorData);
                    throw new Error(errorData.message || "Failed to create dummy user.");
                }
                const dummyData = await dummyRes.json();
                player2Id = dummyData?.data?.user?.id; 
                if (!player2Id) {
                    console.error("Dummy user created, but their ID is missing from response. Dummy data:", dummyData);
                    throw new Error("Dummy Player ID missing after creation.");
                }                
                this.player2 = dummyData?.data?.user?.name || "DummyOpponent";
            }
            const player1Score = this.score[0];
            const player2Score = this.score[1];
            let winnerId: string | null = null;
            if (this.winner === this.player1) {
                winnerId = player1Id;
            } else if (this.winner === originalPlayer2Name || this.winner === this.player2) {
                winnerId = player2Id;
            } else {
                winnerId = null;
            }

            if (!player1Id || !player2Id || !winnerId || player1Score === undefined || player2Score === undefined) {
                console.error("Missing essential match data before sending. Details:", {
                    player1Id,
                    player2Id,
                    winnerId,
                    player1Score,
                    player2Score
                });
                return; 
            }

            const response = await fetch(route, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    player1Id,
                    player2Id,
                    winnerId,
                    score: `${player1Score}-${player2Score}`
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to send match result due to server error.");
            }
        } catch (err) {
            console.error("Send result operation failed:", err);
        }
    }
}