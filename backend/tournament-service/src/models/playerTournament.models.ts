//backend/tournament-service/src/model/playerTournament.models.ts
import { dbPromise } from '../plugins/sqlite.js';

export interface PlayerTournamentData {
    id?: number;
    playerId: number;
    tournamentId: number;
}

export class PlayerTournament {
    /**
     * Initializes the 'player_tournaments' table in the database if it doesn't exist.
     */
    static async createTable() {
        const db = await dbPromise;
        await db.run(`
            CREATE TABLE IF NOT EXISTS player_tournaments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                playerId INTEGER NOT NULL,
                tournamentId INTEGER NOT NULL,
                -- Foreign Key constraints (assuming 'users' table exists and 'tournaments' table is defined)
                -- FOREIGN KEY (playerId) REFERENCES users(id) ON DELETE CASCADE, -- If user comes from a separate service/DB, handle this link differently
                FOREIGN KEY (tournamentId) REFERENCES tournaments(id) ON DELETE CASCADE,
                CONSTRAINT unique_player_tournament UNIQUE (playerId, tournamentId) -- A player can only be in a specific tournament once
            );
        `);
        // Add indexes for common lookup fields
        await db.run(`CREATE INDEX IF NOT EXISTS idx_player_tournaments_player_id ON player_tournaments (playerId);`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_player_tournaments_tournament_id ON player_tournaments (tournamentId);`);
        console.log('PlayerTournament table created or already exists.');
    }

    /**
     * Creates a new player-tournament association record.
     * @param data The PlayerTournamentData object to create (excluding id).
     * @returns The created PlayerTournamentData object with ID.
     */
    static async create(data: Omit<PlayerTournamentData, 'id'>): Promise<PlayerTournamentData> {
        const db = await dbPromise;
        const result = await db.run(
            `INSERT INTO player_tournaments (playerId, tournamentId)
             VALUES (?, ?)`,
            data.playerId,
            data.tournamentId
        );

        return { id: result.lastID, ...data };
    }

    /**
     * Finds a player-tournament association by its ID.
     * @param id The ID of the association.
     * @returns The PlayerTournamentData object or null if not found.
     */
    static async findById(id: number): Promise<PlayerTournamentData | null> {
        const db = await dbPromise;
        const playerTournament = await db.get(`SELECT * FROM player_tournaments WHERE id = ?`, id);
        return playerTournament ? (playerTournament as PlayerTournamentData) : null;
    }

    /**
     * Finds all player-tournament associations for a given tournament.
     * @param tournamentId The ID of the tournament.
     * @returns An array of PlayerTournamentData objects.
     */
    static async findByTournamentId(tournamentId: number): Promise<PlayerTournamentData[]> {
        const db = await dbPromise;
        const players = await db.all(`SELECT * FROM player_tournaments WHERE tournamentId = ?`, tournamentId);
        return players as PlayerTournamentData[];
    }

    /**
     * Deletes a player-tournament association by ID.
     * @param id The ID of the association to delete.
     * @returns True if the deletion was successful, false otherwise.
     */
    static async delete(id: number): Promise<boolean> {
        const db = await dbPromise;
        const result = await db.run(`DELETE FROM player_tournaments WHERE id = ?`, id);
        return (result?.changes ?? 0) > 0;
    }

    /**
     * Deletes all player-tournament associations for a given player ID.
     * @param playerId The ID of the player.
     * @returns True if deletions were successful, false otherwise.
     */
    static async deleteByPlayerId(playerId: number): Promise<boolean> {
        const db = await dbPromise;
        const result = await db.run(`DELETE FROM player_tournaments WHERE playerId = ?`, playerId);
        return (result?.changes ?? 0) > 0;
    }

    /**
     * Deletes all player-tournament associations for a given tournament ID.
     * @param tournamentId The ID of the tournament.
     * @returns True if deletions were successful, false otherwise.
     */
    static async deleteByTournamentId(tournamentId: number): Promise<boolean> {
        const db = await dbPromise;
        const result = await db.run(`DELETE FROM player_tournaments WHERE tournamentId = ?`, tournamentId);
        return (result?.changes ?? 0) > 0;
    }
}
