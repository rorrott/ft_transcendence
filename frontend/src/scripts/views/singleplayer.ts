import { Match } from "../game/match.js";
import { multiNicknames } from "./home.js";

export class SinglePlayer {
    async getHtml() {
        return `
            <h1 class="header_custom mb-10" data-i18n="singleplayer">Singleplayer</h1>
            <h2 class="text-3xl sm:text-xl md:text-xl mb-10 drop-shadow-[2px_2px_0_gris] [text-shadow:_2px_2px_0_rgba(0,0,0,0.8)]" data-i18n="single_title">Play against the AI!</h2>
            <canvas id="gameCanvas"></canvas>
        `;
    }

    async onMounted() {
        let username: string = "Player";
        if (localStorage.getItem("token"))
            username = multiNicknames[0];
        const match: Match = new Match(0, username, "AI");
        match.start();
    }
}