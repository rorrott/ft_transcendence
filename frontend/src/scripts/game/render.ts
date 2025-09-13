import { BACKGROUND_COLOR, ITEMS_COLOR, MAX_SCORE } from "./config.js";
import { canvas, ctx, match, ball, leftPaddle, rightPaddle } from "./state.js";

function drawScores() {
    ctx.font = "100px 'Press Start 2P'";
    ctx.fillStyle = ITEMS_COLOR;
    ctx.fillText(`${match?.score[0]}`, canvas.width / 2 - 100, 120);
    ctx.fillText(`${match?.score[1]}`, canvas.width / 2 + 100, 120);
}

function drawCenterLine() {
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = ITEMS_COLOR;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.closePath();
}

function drawText() {
    ctx.font = "40px 'Press Start 2P'";
    ctx.fillStyle = ITEMS_COLOR;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("Pong".split('').join(' '.repeat(1)), canvas.width / 2, canvas.height - 10);
}

export function renderGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ball.draw();
    leftPaddle.draw();
    rightPaddle.draw();
    drawScores();
    drawCenterLine();
    drawText();
}

export function renderPauseMenu() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height); 
    ctx.fillStyle = ITEMS_COLOR;
    ctx.font = "24px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText("PAUSE", canvas.width / 2, canvas.height / 5);
    ctx.font = "16px 'Press Start 2P'";
    ctx.fillText("Press P to Resume", canvas.width / 2, canvas.height / 5 * 2);
    ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 5 * 3);
    ctx.fillText("Press ESC to Quit", canvas.width / 2, canvas.height / 5 * 4);
}

export function renderEndMenu() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = ITEMS_COLOR;
    ctx.font = "24px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText("END", canvas.width / 2, canvas.height / 5);
    ctx.font = "16px 'Press Start 2P'";
    ctx.fillText(!match?.gameMode && match?.score[1] === MAX_SCORE ? `Unfortunately you lost, try again!`
        : `Congratulations ${match?.score[0] === MAX_SCORE ? match?.player1 : match?.player2}, you win!`, canvas.width / 2, canvas.height / 5 * 2);
    ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 5 * 3);
    ctx.fillText("Press ESC to Quit", canvas.width / 2, canvas.height / 5 * 4);
}

export function renderMatchIntro() {
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = ITEMS_COLOR;
    ctx.font = "24px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText("Next Match", canvas.width / 2, canvas.height / 5);
    ctx.fillText(`${match?.player1} vs ${match?.player2}`, canvas.width / 2, canvas.height / 5 * 2);
    ctx.font = "16px 'Press Start 2P'";
    ctx.fillText("Press ENTER to start", canvas.width / 2, canvas.height / 5 * 3.5);
}

export function renderRanking(ranking: string[]) {
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = ITEMS_COLOR;
    ctx.font = "24px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText("RANKING", canvas.width / 2, canvas.height / 5);
    ctx.font = "16px 'Press Start 2P'";
    ctx.fillText(`${ranking[0]} win the tournament, congratulations!`, canvas.width / 2, canvas.height / 8 * 3);
    ctx.fillText(`1) ${ranking[0]}`, canvas.width / 2, canvas.height / 8 * 4);
    ctx.fillText(`2) ${ranking[1]}`, canvas.width / 2, canvas.height / 8 * 5);
    ctx.fillText(`3) ${ranking[2]}`, canvas.width / 2, canvas.height / 8 * 6);
    ctx.fillText(`4) ${ranking[3]}`, canvas.width / 2, canvas.height / 8 * 7);
}