//backend/tournament-service/src/model/tournamentMatch.models.ts
import { dbPromise } from '../plugins/sqlite.js';

export enum TournamentMatchState {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
}

export interface TournamentMatchData {
    id?: number;
    tournamentId: number;
    player1Id: number;
    player2Id: number | null;
    winnerId: number | null;
    roundNumber: number;
    matchNumberInRound: number;
    score: string | null;
    state: TournamentMatchState;
    createdAt?: string;
    updatedAt?: string;
}

export class TournamentMatch {
    /**
     * Initializes the 'tournament_matches' table in the database if it doesn't exist.
     */
    static async createTable() {
        const db = await dbPromise;
        await db.run(`
            CREATE TABLE IF NOT EXISTS tournament_matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tournamentId INTEGER NOT NULL,
                player1Id INTEGER NOT NULL,
                player2Id INTEGER,
                winnerId INTEGER,
                roundNumber INTEGER NOT NULL,
                matchNumberInRound INTEGER NOT NULL,
                score TEXT,
                state TEXT NOT NULL DEFAULT 'PENDING',
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
                -- Foreign Key constraints (assuming 'users' table exists and 'tournaments' table is defined)
                FOREIGN KEY (tournamentId) REFERENCES tournaments(id) ON DELETE CASCADE,
                -- FOREIGN KEY (player1Id) REFERENCES users(id) ON DELETE RESTRICT,
                -- FOREIGN KEY (player2Id) REFERENCES users(id) ON DELETE RESTRICT,
                -- FOREIGN KEY (winnerId) REFERENCES users(id) ON DELETE RESTRICT,
                CONSTRAINT check_tournament_match_state CHECK (state IN ('${TournamentMatchState.PENDING}', '${TournamentMatchState.COMPLETED}'))
            );
        `);
        // Add indexes for common lookup fields
        await db.run(`CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON tournament_matches (tournamentId);`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_tournament_matches_player1_id ON tournament_matches (player1Id);`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_tournament_matches_player2_id ON tournament_matches (player2Id);`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_tournament_matches_winner_id ON tournament_matches (winnerId);`);
        console.log('TournamentMatch table created or already exists.');
    }

    /**
     * Creates a new tournament match record.
     * @param data The TournamentMatchData object to create (excluding id, timestamps).
     * @returns The created TournamentMatchData object with ID and timestamps.
     */
    static async create(data: Omit<TournamentMatchData, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentMatchData> {
        const db = await dbPromise;
        const now = new Date().toISOString();
        const result = await db.run(
            `INSERT INTO tournament_matches (tournamentId, player1Id, player2Id, winnerId, roundNumber, matchNumberInRound, score, state, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            data.tournamentId,
            data.player1Id,
            data.player2Id ?? null,
            data.winnerId ?? null,
            data.roundNumber,
            data.matchNumberInRound,
            data.score ?? null,
            data.state,
            now,
            now
        );
        return { id: result.lastID, ...data, createdAt: now, updatedAt: now };
    }
    /**
     * Finds a tournament match by its ID.
     * @param id The ID of the match.
     * @returns The TournamentMatchData object or null if not found.
     */
    static async findById(id: number): Promise<TournamentMatchData | null> {
        const db = await dbPromise;
        const match = await db.get(`SELECT * FROM tournament_matches WHERE id = ?`, id);
        return match ? (match as TournamentMatchData) : null;
    }
    /**
     * Finds all tournament matches for a specific tournament.
     * @param tournamentId The ID of the tournament.
     * @returns An array of TournamentMatchData objects.
     */
    static async findByTournamentId(tournamentId: number): Promise<TournamentMatchData[]> {
        const db = await dbPromise;
        const matches = await db.all(`SELECT * FROM tournament_matches WHERE tournamentId = ? ORDER BY roundNumber ASC, matchNumberInRound ASC`, tournamentId);
        return matches as TournamentMatchData[];
    }
    /**
     * Finds a specific match in a tournament by its round and match number.
     * @param tournamentId The ID of the tournament.
     * @param roundNumber The round number.
     * @param matchNumberInRound The match number within the round.
     * @returns The TournamentMatchData object or null if not found.
     */
    static async findMatchByRoundAndNumber(tournamentId: number, roundNumber: number, matchNumberInRound: number): Promise<TournamentMatchData | null> {
        const db = await dbPromise;
        const match = await db.get(
            `SELECT * FROM tournament_matches WHERE tournamentId = ? AND roundNumber = ? AND matchNumberInRound = ?`,
            tournamentId, roundNumber, matchNumberInRound
        );
        return match ? (match as TournamentMatchData) : null;
    }
    /**
     * Updates a tournament match record by ID.
     * @param id The ID of the match to update.
     * @param data The partial TournamentMatchData object with fields to update.
     * @returns True if the update was successful, false otherwise.
     */
    static async update(id: number, data: Partial<TournamentMatchData>): Promise<boolean> {
        const db = await dbPromise;
        const now = new Date().toISOString();

        const updates: string[] = [];
        const values: (string | number | null)[] = [];
        if (data.tournamentId !== undefined) { updates.push('tournamentId = ?'); values.push(data.tournamentId); }
        if (data.player1Id !== undefined) { updates.push('player1Id = ?'); values.push(data.player1Id); }
        if (data.player2Id !== undefined) { updates.push('player2Id = ?'); values.push(data.player2Id); }
        if (data.winnerId !== undefined) { updates.push('winnerId = ?'); values.push(data.winnerId); }
        if (data.roundNumber !== undefined) { updates.push('roundNumber = ?'); values.push(data.roundNumber); }
        if (data.matchNumberInRound !== undefined) { updates.push('matchNumberInRound = ?'); values.push(data.matchNumberInRound); }
        if (data.score !== undefined) { updates.push('score = ?'); values.push(data.score); }
        if (data.state !== undefined) { updates.push('state = ?'); values.push(data.state); }
        if (updates.length === 0)
            return false;

        updates.push('updatedAt = ?');
        values.push(now);
        const query = `UPDATE tournament_matches SET ${updates.join(', ')} WHERE id = ?`;
        values.push(id);
        const result = await db.run(query, ...values);
        return (result?.changes ?? 0) > 0;
    }
    /**
     * Deletes a tournament match record by ID.
     * @param id The ID of the match to delete.
     * @returns True if the deletion was successful, false otherwise.
     */
    static async delete(id: number): Promise<boolean> {
        const db = await dbPromise;
        const result = await db.run(`DELETE FROM tournament_matches WHERE id = ?`, id);
        return (result?.changes ?? 0) > 0;
    }
    /**
     * Deletes all tournament matches for a specific tournament.
     * @param tournamentId The ID of the tournament.
     * @returns True if the deletion was successful, false otherwise.
     */
    static async deleteByTournamentId(tournamentId: number): Promise<boolean> {
        const db = await dbPromise;
        const result = await db.run(`DELETE FROM tournament_matches WHERE tournamentId = ?`, tournamentId);
        return (result?.changes ?? 0) > 0;
    }
    /**
     * Finds all pending matches for a specific tournament and round, ordered by match number.
     * @param tournamentId The ID of the tournament.
     * @param roundNumber The round number.
     * @returns An array of TournamentMatchData objects.
     */
    static async findPendingMatchesInRound(tournamentId: number, roundNumber: number): Promise<TournamentMatchData[]> {
        const db = await dbPromise;
        const matches = await db.all(
            `SELECT * FROM tournament_matches
             WHERE tournamentId = ? AND roundNumber = ? AND state = ?
             ORDER BY matchNumberInRound ASC`,
            tournamentId,
            roundNumber,
            TournamentMatchState.PENDING
        );
        return matches as TournamentMatchData[];
    }
    /**
     * Finds all completed matches for a specific tournament and round, ordered by match number.
     * @param tournamentId The ID of the tournament.
     * @param roundNumber The round number.
     * @returns An array of TournamentMatchData objects.
     */
    static async findCompletedMatchesInRound(tournamentId: number, roundNumber: number): Promise<TournamentMatchData[]> {
        const db = await dbPromise;
        const matches = await db.all(
            `SELECT * FROM tournament_matches
             WHERE tournamentId = ? AND roundNumber = ? AND state = ?
             ORDER BY matchNumberInRound ASC`,
            tournamentId,
            roundNumber,
            TournamentMatchState.COMPLETED
        );
        return matches as TournamentMatchData[];
    }
}
