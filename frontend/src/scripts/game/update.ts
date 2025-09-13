import { MIN_SPEED, MAX_SPEED, SPEED_INC, BORDER, MIN_DY } from "./config.js";
import { Ball } from "./ball.js";
import { Paddle } from "./paddle.js";
import { canvas, match, gameStates, keys, ball, leftPaddle, rightPaddle } from "./state.js";
import { updateAI } from "./ia.js";

function hitPaddle(ball:Ball, paddle: Paddle): boolean {
    return (
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.x + ball.radius > paddle.x &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.y + ball.radius > paddle.y
    );
}

function onPaddleHit(ball: Ball, paddle: Paddle) {
    const paddleCenterY = paddle.y + paddle.height / 2;
    ball.dy = (ball.y - paddleCenterY) / (paddle.height / 2);
    ball.dx = -ball.dx;

    let length = Math.hypot(ball.dx, ball.dy);
    ball.dx /= length;
    ball.dy /= length;

    ball.speed = Math.min(ball.speed * SPEED_INC, MAX_SPEED);
    ball.x += ball.dx * ball.radius;

    if ((ball.y < BORDER || ball.y > canvas.height - BORDER)
        && (Math.abs(ball.dy) < MIN_DY || Math.abs(Math.abs(ball.dy) - 1) < MIN_DY)) {
        ball.dy = ball.y < BORDER ? MIN_DY : -MIN_DY;
        length = Math.hypot(ball.dx, ball.dy);
        ball.dx /= length;
        ball.dy /= length;
    }
}  

export function updateGame() {
    ball.move();
    if (!match?.gameMode) updateAI();
    if (keys.w) leftPaddle.moveUp();
    if (keys.s) leftPaddle.moveDown();
    if (keys.Up) rightPaddle.moveUp();
    if (keys.Down) rightPaddle.moveDown();
    if (hitPaddle(ball, leftPaddle)) onPaddleHit(ball, leftPaddle);
    if (hitPaddle(ball, rightPaddle)) onPaddleHit(ball, rightPaddle);
}

export function scoreGoal(playerIndex: number) {
    match?.updateScore(playerIndex);
    if (!match?.gameMode) gameStates.isFirstUpdate = true;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = playerIndex ? -1 : 1;
    ball.dy = 0;
    ball.speed = MIN_SPEED;
}