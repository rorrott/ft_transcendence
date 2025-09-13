import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./config.js";
import { Match } from "./match.js";
import { Ball } from "./ball.js";
import { Paddle } from "./paddle.js";

export let canvas: HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;

export function initCanvas() {
	const el = document.getElementById("gameCanvas") as HTMLCanvasElement;
	if (!el) throw new Error("Canvas not found");
	canvas = el;
	ctx = el.getContext("2d")!;
	canvas.width = CANVAS_WIDTH;
	canvas.height = CANVAS_HEIGHT;
}

export let match: Match | null = null;
export function setMatch(currentMatch: Match) {
    match = currentMatch; 
}

export let animationId: number | null = null;
export function setAnimationId(id: number | null) {
    animationId = id;
}

export let gameStates: { [key: string]: boolean } = {
    isIntro: false,
    isRunning: false,
    isEnd: false,
    isFirstUpdate: true
}

export let keys: { [key: string]: boolean } = {
    w: false,
    s: false,
    Up: false,
    Down: false
};

export const ball = new Ball();
export const leftPaddle = new Paddle();
export const rightPaddle = new Paddle();
