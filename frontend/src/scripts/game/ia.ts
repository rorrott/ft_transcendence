import { CANVAS_HEIGHT, REACT_TIME, IMPRECISION, TRESHOLD } from "./config.js";
import { canvas, gameStates, keys, ball, rightPaddle } from "./state.js";

function predictImpactY(): number {
    let x = ball.x;
    let y = ball.y;
    let dx = ball.dx;
    let dy = ball.dy;

    while ((dx > 0 && x < rightPaddle.x) || (dx < 0 && x > rightPaddle.x)) {
        x += dx * ball.speed;
        y += dy * ball.speed;
        if (y - ball.radius < 0 || y + ball.radius > canvas.height)
            dy = -dy;
    }
    return y;
}

let lastUpdate: number = 0;
let targetY: number = CANVAS_HEIGHT / 2;

export function updateAI() {
    if (gameStates.isFirstUpdate)
        lastUpdate = 0;
    const now = performance.now();
    if (now - lastUpdate > REACT_TIME) {
        lastUpdate = now;
        gameStates.isFirstUpdate = false;
        targetY = ball.dx < 0 ? canvas.height / 2 : predictImpactY();
        targetY += (Math.random() - 0.5) * ball.speed * IMPRECISION;
    }

    const paddleCenter = rightPaddle.y + rightPaddle.height / 2;
    if (paddleCenter < targetY - TRESHOLD) {
      keys.Up = false;
      keys.Down = true;
    } else if (paddleCenter > targetY + TRESHOLD) {
      keys.Up = true;
      keys.Down = false;
    } else {
      keys.Up = false;
      keys.Down = false;
    }
}