// backend/tournament-service/src/service/tournaments.service.ts
import { Tournament, TournamentData } from '../models/tournament.models.js';
import { PlayerTournament, PlayerTournamentData } from '../models/playerTournament.models.js';
import { TournamentMatchState, TournamentMatch, TournamentMatchData } from '../models/tournamentMatch.models.js';

import axios from 'axios';

async function reportMatchToUserService(
    matchData: {
        player1Id: number;
        player2Id: number;
        winnerId: number;
        player1Score: number;
        player2Score: number;
        playedAt?: Date;
    },
    token: string
) {
    console.log('[reportMatchToUserService] matchData:', matchData); // for debug
    const payloadForUserService = {
        player2Id: matchData.player2Id,
        winnerId: matchData.winnerId,
        score: `${matchData.player1Score}-${matchData.player2Score}`
    };
    console.log('Sending payload to user-service/matches:', payloadForUserService); // Add this for debugging
    try {
        await axios.post(
            'http://user-service:5501/api/v1/user/matches',
            payloadForUserService,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        console.log('Match reported to user-service successfully.');
    } catch (error) {
        // Log the full error response from axios for debugging
        if (axios.isAxiosError(error)) {
            console.error('Error reporting match to user-service:', error.response?.data || error.message);
            throw new Error(`User service error: ${error.response?.data?.message || 'Failed to report match.'}`);
        }
        console.error('Unknown error reporting match to user-service:', error);
        throw new Error('Failed to report match to user service due to an unknown error.');
    }
}

interface SubmitResultPayload {
    winner_id: number;
    score: string;
}

// --- Tournament Management ---
export const createTournament = async ({ name }: { name: string }): Promise<TournamentData> => {
    // Tournament.create is already updated to return TournamentData directly
    return Tournament.create({ name });
};

export const joinTournament = async (tournament_id: number, player_id: number): Promise<PlayerTournamentData> => {
    // PlayerTournament.create is already updated to return PlayerTournamentData directly
    return PlayerTournament.create({ tournamentId: tournament_id, playerId: player_id });
};

/*export const startTournament = async (tournament_id: number): Promise<TournamentMatchData[]> => {
    const players = await PlayerTournament.findByTournamentId(tournament_id);
    console.log('Players found for tournament', tournament_id, ':', players.map(p => p.playerId));
    if (players.length < 2)
        throw new Error('Not enough players to start tournament (minimum 2 needed).');
    const shuffled = players.sort(() => 0.5 - Math.random());
    const matchesToCreate: Omit<TournamentMatchData, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    for (let i = 0; i < shuffled.length; i += 2) {
        // Handle odd number of players (last player gets a bye)
        const player1Id = shuffled[i]?.playerId;
        const player2Id = shuffled[i + 1]?.playerId || null; // Player2 can be null for a bye
        if (!player1Id) {
            console.warn(`Skipping match creation due to missing player1Id at index ${i}. This should not happen.`);
            continue;
        }
        matchesToCreate.push({
            tournamentId: tournament_id,
            roundNumber: 1,
            matchNumberInRound: Math.floor(i / 2) + 1,
            player1Id: player1Id,
            player2Id: player2Id,
            winnerId: null,
            score: null,
            state: TournamentMatchState.PENDING,
        });
    }
    console.log('Attempting to create initial matches:', JSON.stringify(matchesToCreate, null, 2));
    try {
        const createdMatches: TournamentMatchData[] = [];
        for (const matchData of matchesToCreate) {
            const newMatch = await TournamentMatch.create(matchData);
            createdMatches.push(newMatch);
        }
        console.log('Matches successfully created!');
        return createdMatches;
    } catch (error) {
        console.error('Error creating initial matches:', error);
        throw error;
    }
};*/

export const startTournament = async (tournament_id: number): Promise<TournamentMatchData[]> => {
    const players = await PlayerTournament.findByTournamentId(tournament_id);
    console.log('[startTournament Service] Players found for tournament', tournament_id, ':', players.map(p => p.playerId));

    if (players.length < 2) {
        throw new Error('Not enough players to start tournament (minimum 2 needed).');
    }

    const shuffled = players.sort(() => 0.5 - Math.random());
    console.log('[startTournament Service] Shuffled players:', shuffled.map(p => p.playerId)); // Log shuffled players

    const matchesToCreate: Omit<TournamentMatchData, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    for (let i = 0; i < shuffled.length; i += 2) {
        const player1Id = shuffled[i]?.playerId;
        const player2Id = shuffled[i + 1]?.playerId || null;

        if (!player1Id) {
            console.warn(`[startTournament Service] Skipping match creation due to missing player1Id at index ${i}. This should not happen.`);
            continue;
        }

        console.log(`[startTournament Service] Preparing match ${Math.floor(i / 2) + 1}: Player1=${player1Id}, Player2=${player2Id}`); // Log players for each prospective match

        matchesToCreate.push({
            tournamentId: tournament_id,
            roundNumber: 1,
            matchNumberInRound: Math.floor(i / 2) + 1,
            player1Id: player1Id,
            player2Id: player2Id,
            winnerId: null,
            score: null,
            state: TournamentMatchState.PENDING,
        });
    }

    console.log('[startTournament Service] Matches to create before DB insertion:', JSON.stringify(matchesToCreate, null, 2));

    try {
        const createdMatches: TournamentMatchData[] = [];
        for (const matchData of matchesToCreate) {
            const newMatch = await TournamentMatch.create(matchData);
            createdMatches.push(newMatch);
        }
        console.log('[startTournament Service] Successfully created matches:', JSON.stringify(createdMatches, null, 2)); // Log the actual created matches
        return createdMatches;
    } catch (error) {
        console.error('[startTournament Service] Error creating initial matches:', error);
        throw error;
    }
};

// Also in tournaments.service.ts, in getBracket function
export const getBracket = async (tournamentId: number) => {
    const matches = await TournamentMatch.findByTournamentId(tournamentId);
    console.log(`[getBracket Service] Found ${matches.length} matches for tournament ${tournamentId}:`, JSON.stringify(matches, null, 2)); // Log what's found
    const rounds: Record<number, TournamentMatchData[]> = {};
    matches.forEach((match) => {
        if (!rounds[match.roundNumber]) rounds[match.roundNumber] = [];
        rounds[match.roundNumber].push(match);
    });
    console.log(`[getBracket Service] Organized into rounds:`, JSON.stringify(rounds, null, 2)); // Log organized rounds
    return Object.entries(rounds).map(([round, matches]) => ({
        round: +round,
        matches,
    }));
};

/*export const getBracket = async (tournamentId: number) => {
    const matches = await TournamentMatch.findByTournamentId(tournamentId);
    const rounds: Record<number, TournamentMatchData[]> = {};
    matches.forEach((match) => {
        if (!rounds[match.roundNumber]) rounds[match.roundNumber] = [];
        rounds[match.roundNumber].push(match);
    });
    return Object.entries(rounds).map(([round, matches]) => ({
        round: +round,
        matches,
    }));
};*/

export const submitTournamentResult = async (matchId: number, { winner_id, score }: SubmitResultPayload, token: string) => {
    const match = await TournamentMatch.findById(matchId);
    if (!match) throw new Error(`Match with ID ${matchId} not found`);
    if (match.state === TournamentMatchState.COMPLETED) throw new Error('Match already completed');
    // Get all pending matches for the current round
    const pendingMatchesInRound = await TournamentMatch.findPendingMatchesInRound(
        match.tournamentId,
        match.roundNumber
    );
    const firstPending = pendingMatchesInRound.sort((a, b) => a.matchNumberInRound - b.matchNumberInRound)[0];
    // Check if this is the correct match to submit
    if (firstPending && firstPending.id !== match.id) {
        throw new Error(`This match cannot be submitted yet. Wait for Match #${firstPending.matchNumberInRound}.`);
    }
    // Parse score and validate
    const [player1ScoreStr, player2ScoreStr] = score.split('-');
    const player1Score = Number(player1ScoreStr);
    const player2Score = Number(player2ScoreStr);
    if (isNaN(player1Score) || isNaN(player2Score) || !score.includes('-'))
        throw new Error('Invalid score format. Expected "X-Y" where X and Y are numbers.');
    // Update the match record
    const updated = await TournamentMatch.update(match.id!, {
        state: TournamentMatchState.COMPLETED,
        winnerId: winner_id,
        score: score,
    });
    if (!updated)
        throw new Error(`Failed to update tournament match with ID ${matchId}.`);
    if (match.player1Id === null || match.player2Id === null)
        throw new Error('Cannot report result: one or both players are missing for this match.');
    console.log('[submitTournamentResult] winner_id:', winner_id); // for debug
    await reportMatchToUserService({
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        winnerId: winner_id,
        player1Score,
        player2Score,
        playedAt: new Date(),
    }, token);
    // Check for remaining matches in the current round
    const remainingMatches = await TournamentMatch.findPendingMatchesInRound(
        match.tournamentId,
        match.roundNumber
    );
    // If all matches in the current round are completed, create the next round
    if (remainingMatches.length === 0) {
        console.log(`All matches in round ${match.roundNumber} for tournament ${match.tournamentId} completed. Creating next round.`);
        await createNextRound(match.tournamentId, match.roundNumber);
    }
    // Re-fetch the match to return the latest state
    const currentMatchState = await TournamentMatch.findById(match.id!);
    if (!currentMatchState)
        throw new Error(`Failed to retrieve updated match with ID ${match.id!}.`);
    return currentMatchState;
};

async function createNextRound(tournament_id: number, completedRound: number) {
    console.log(`[createNextRound] Starting for Tournament ID: ${tournament_id}, Completed Round: ${completedRound}`);
    const completedMatches = await TournamentMatch.findCompletedMatchesInRound(
        tournament_id,
        completedRound
    );
    if (completedMatches.length === 0) {
        console.warn(`[createNextRound] No completed matches found for Tournament ID: ${tournament_id}, Round: ${completedRound}. Cannot create next round.`);
        return;
    }
    const winners = completedMatches
        .map(match => match.winnerId)
        .filter((winnerId): winnerId is number => winnerId !== null);
    console.log(`[createNextRound] Winners from Round ${completedRound}: ${winners.length > 0 ? winners.join(', ') : 'None'}`);
    // If there's only one winner, the tournament is over!
    if (winners.length === 1) {
        const overallWinnerId = winners[0];
        console.log(`[createNextRound] Tournament ${tournament_id} completed! Overall Winner: ${overallWinnerId}`);
        // Update the Tournament model to mark it as completed and set the winner
        const tournament = await Tournament.findById(tournament_id);
        if (tournament) {
            const updated = await Tournament.update(tournament.id!, { /* state: 'COMPLETED', winnerId: overallWinnerId */ });
            if (updated) {
                 console.log(`[createNextRound] Tournament ${tournament_id} marked as COMPLETED.`);
            }
        } else {
            console.warn(`[createNextRound] Tournament ${tournament_id} not found to mark as completed.`);
        }
        return;
    }
    const nextMatchesToCreate: Omit<TournamentMatchData, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    for (let i = 0; i < winners.length; i += 2) {
        const player1Id = winners[i];
        const player2Id = winners[i + 1] || null; // Will be null for byes if `winners.length` is odd

        nextMatchesToCreate.push({
            tournamentId: tournament_id,
            roundNumber: completedRound + 1,
            matchNumberInRound: Math.floor(i / 2) + 1,
            player1Id: player1Id,
            player2Id: player2Id,
            winnerId: null, // New matches are pending
            score: null, // New matches have no score
            state: TournamentMatchState.PENDING,
        });
    }
    if (nextMatchesToCreate.length > 0) {
        console.log(`[createNextRound] Attempting to create ${nextMatchesToCreate.length} matches for Round ${completedRound + 1}:`);
        console.log(JSON.stringify(nextMatchesToCreate, null, 2));
        try {
            const createdMatches: TournamentMatchData[] = [];
            for (const matchData of nextMatchesToCreate) {
                const newMatch = await TournamentMatch.create(matchData);
                createdMatches.push(newMatch);
            }
            console.log(`[createNextRound] Matches successfully created for Round ${completedRound + 1}!`);
            return createdMatches;
        } catch (error) {
            console.error(`[createNextRound] Error creating matches for next round:`, error);
            throw error;
        }
    } else {
        console.log(`[createNextRound] No further matches to create for Tournament ID: ${tournament_id}.`);
    }
}
