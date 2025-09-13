import { tournamentNicknames } from "./home.js"
import { Tournament } from "../game/tournament.js";

export class TournamentView {
    async getHtml() {
        return `
			<h1 class="header_custom mb-10" data-i18n="tournament">Tournament</h1>
			<h2 class="text-lg mb-10 drop-shadow-[2px_2px_0_gris] [text-shadow:_2px_2px_0_rgba(0,0,0,0.8)]" data-i18n="tournament_title">Play against other players in a tournament!</h2> 
			<h2 class="text-gray-800 text-lg mb-5">
			Players:
			<span class="font-bold text-lg mx-1">${tournamentNicknames[0]}</span>,
			<span class="font-bold text-lg mx-1">${tournamentNicknames[1]}</span>,
			<span class="font-bold text-lg mx-1">${tournamentNicknames[2]}</span>,
			<span class="font-bold text-lg mx-1">${tournamentNicknames[3]}</span>
			</h2>
            <canvas id="gameCanvas"></canvas>
        `;
    }

    async onMounted() {
		const tournament: Tournament = new Tournament(tournamentNicknames);
		tournament.startNextMatch();
    }

}