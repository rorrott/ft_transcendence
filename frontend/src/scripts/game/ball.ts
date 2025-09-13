import { ITEMS_COLOR, MIN_SPEED } from "./config.js";
import { canvas, ctx } from "./state.js";
import { scoreGoal } from "./update.js";

export class Ball {
    x!: number;
    y!: number;
    radius!: number;
    dx!: number;
    dy!: number;
    speed!: number;
    color!: string;

    init() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.radius = 5;
        this.dx = Math.floor(Math.random() * 2) ? -1 : 1;
        this.dy = 0;
        this.speed = MIN_SPEED;
        this.color = ITEMS_COLOR;
    }

    move() {
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
        
        if (this.x < 0)
            scoreGoal(1);
        if (this.x > canvas.width)
            scoreGoal(0);
        if (this.y + this.radius > canvas.height || this.y - this.radius < 0)
            this.dy = -this.dy;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    logPosition() {
        console.log(`Ball position: x = ${this.x}, y = ${this.y}`);
    }
}
