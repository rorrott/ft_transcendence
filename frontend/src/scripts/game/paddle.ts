import { BORDER, ITEMS_COLOR, PADDLE_SPEED } from "./config.js";
import { canvas, ctx } from "./state.js"

export class Paddle {
    width!: number;
    height!: number;
    x!: number;
    y!: number;
    speed!: number;
    color!: string;

    init(isLeft: boolean) {
        this.width = canvas.width * 0.01;
        this.height = canvas.height * 0.15;
        this.x = isLeft ? BORDER : canvas.width - this.width - BORDER;
        this.y = canvas.height / 2 - this.height / 2;
        this.speed = PADDLE_SPEED;
        this.color = ITEMS_COLOR;
    }

    moveUp() {
        if (this.y - this.speed >= BORDER)
            this.y -= this.speed;
        else
            this.y = BORDER;
    }
  
    moveDown() {
        if (this.y + this.height + this.speed <= canvas.height - BORDER)
            this.y += this.speed;
        else
            this.y = canvas.height - this.height - BORDER;
    }
  
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  
    logPosition() {
        console.log(`Paddle position : x = ${this.x}, y = ${this.y}`);
    }
  }
  