import { multiNicknames } from "./home.js"
import { Match } from "../game/match.js";

export class Multiplayer {
    async getHtml() {
        return `
            <h1 class="header_custom mb-10" data-i18n="multiplayer">Multiplayer</h1>
            <h2 class="text-2xl sm:text-lg md:text-xl mb-10 drop-shadow-[2px_2px_0_gris] [text-shadow:_2px_2px_0_rgba(0,0,0,0.8)]" data-i18n="multi_title">Play against your friends in real-time!</h2>
            <h2 class="text-black text-xl mb-5 font-bold">
            ${multiNicknames[0]}
            <span class="text-lg font-normal mx-4">vs</span>
            ${multiNicknames[1]}
            </h2>            
            <canvas id="gameCanvas"></canvas>
        `;
    }

    async onMounted() {
        const match: Match = new Match(1, multiNicknames[0], multiNicknames[1]);;
        match.start();
    }

}