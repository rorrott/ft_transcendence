import { initCanvas, match, setAnimationId, gameStates, keys, ball, leftPaddle, rightPaddle } from "./state.js";
import { updateGame } from "./update.js";
import { renderGame } from "./render.js";
import { navigateTo } from "../main.js";

window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown")
        event.preventDefault();
    if (event.key === "Escape") navigateTo("/");
    if (!gameStates.isIntro && !gameStates.isEnd && event.key === "p") match?.pause();
    if (!gameStates.isIntro && event.key === "r") match?.restart();
    if (gameStates.isIntro && event.key === "Enter") {
        gameStates.isIntro = false;
        setAnimationId(requestAnimationFrame(gameLoop));
    }
    if (gameStates.isRunning) {
        if (event.key === "w") keys.w = true;
        if (event.key === "s") keys.s = true;
        if (match?.gameMode && event.key === "ArrowUp") keys.Up = true;
        if (match?.gameMode && event.key === "ArrowDown") keys.Down = true;
    }
});

window.addEventListener("keyup", (event) => {
    if (gameStates.isRunning) {
        if (event.key === "w") keys.w = false;
        if (event.key === "s") keys.s = false;
        if (match?.gameMode && event.key === "ArrowUp") keys.Up = false;
        if (match?.gameMode && event.key === "ArrowDown") keys.Down = false;
    }
});

export function gameLoop() {
    if (!gameStates.isRunning || gameStates.isEnd) {
        setAnimationId(null);
        return;
    }
    updateGame();
    renderGame();
    setAnimationId(requestAnimationFrame(gameLoop));
}

export function initGame() {
    initCanvas();
    gameStates.isIntro = true;
    gameStates.isRunning = true;
    gameStates.isEnd = false;
    gameStates.isFirstUpdate = true;
    keys.w = false;
    keys.s = false;
    keys.Up = false;
    keys.Down = false;
    ball.init();
    leftPaddle.init(true);
    rightPaddle.init(false);
}
