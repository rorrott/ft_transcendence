//backend/tournament-service/src/model/casualMatch.models.ts
import { dbPromise } from '../plugins/sqlite.js';

export enum CasualMatchState {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export interface CasualMatchData {
    id?: number;
    player1_id: number;
    player2_id: number;
    state: CasualMatchState;
    winner_id?: number | null;
    score?: string | null;
    tournament_id?: number | null;
    createdAt?: string;
    updatedAt?: string;
}

export class CasualMatch {
    /**
     * Initializes the 'casual_matches' table in the database if it doesn't exist.
     */
    static async createTable() {
        const db = await dbPromise;
        /*await db.run(`
            CREATE TABLE IF NOT EXISTS casual_matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player1_id INTEGER NOT NULL,
                player2_id INTEGER NOT NULL,
                state TEXT NOT NULL DEFAULT 'PENDING',
                winner_id INTEGER,
                score TEXT,
                tournament_id INTEGER,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
                -- Foreign Key constraints (assuming 'users' table exists in a shared or accessible DB, if not, remove/adjust)
                -- FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE RESTRICT,
                -- FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE RESTRICT,
                -- FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE RESTRICT,
                CONSTRAINT check_casual_match_state CHECK (state IN ('${CasualMatchState.PENDING}', '${CasualMatchState.IN_PROGRESS}', '${CasualMatchState.COMPLETED}', '${CasualMatchState.CANCELLED}'))
            );
        `);*/
        await db.run(`
            CREATE TABLE IF NOT EXISTS casual_matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player1_id INTEGER NOT NULL,
                player2_id INTEGER NOT NULL,
                state TEXT NOT NULL DEFAULT 'PENDING',
                winner_id INTEGER,
                score TEXT,
                tournament_id INTEGER,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT check_casual_match_state CHECK (
                state IN (
                    '${CasualMatchState.PENDING}',
                    '${CasualMatchState.IN_PROGRESS}',
                    '${CasualMatchState.COMPLETED}',
                    '${CasualMatchState.CANCELLED}'
                )
            )
        );
    `);
    // Add indexes for common lookup fields
    await db.run(`CREATE INDEX IF NOT EXISTS idx_casual_matches_player1_id ON casual_matches (player1_id);`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_casual_matches_player2_id ON casual_matches (player2_id);`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_casual_matches_winner_id ON casual_matches (winner_id);`);
    console.log('CasualMatch table created or already exists.');
    }

    /**
     * Creates a new casual match record.
     * @param data The CasualMatchData object to create (excluding id, timestamps).
     * @returns The created CasualMatchData object with ID and timestamps.
     */
    static async create(data: Omit<CasualMatchData, 'id' | 'createdAt' | 'updatedAt'>): Promise<CasualMatchData> {
        const db = await dbPromise;
        const now = new Date().toISOString();

        const result = await db.run(
            `INSERT INTO casual_matches (player1_id, player2_id, tournament_id, state, winner_id, score, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            data.player1_id,
            data.player2_id,
            data.tournament_id ?? null,
            data.state,
            data.winner_id ?? null,
            data.score ?? null,
            now,
            now
        );
        return { id: result.lastID, ...data, createdAt: now, updatedAt: now };
    }

    /**
     * Finds a casual match by its ID.
     * @param id The ID of the casual match.
     * @returns The CasualMatchData object or null if not found.
     */
    static async findById(id: number): Promise<CasualMatchData | null> {
        const db = await dbPromise;
        const match = await db.get(`SELECT * FROM casual_matches WHERE id = ?`, id);
        return match ? (match as CasualMatchData) : null;
    }

    /**
     * Updates a casual match record by ID.
     * @param id The ID of the casual match to update.
     * @param data The partial CasualMatchData object with fields to update.
     * @returns True if the update was successful, false otherwise.
     */
    static async update(id: number, data: Partial<CasualMatchData>): Promise<boolean> {
        const db = await dbPromise;
        const now = new Date().toISOString();

        const updates: string[] = [];
        const values: (string | number | null)[] = [];

        if (data.player1_id !== undefined) { updates.push('player1_id = ?'); values.push(data.player1_id); }
        if (data.player2_id !== undefined) { updates.push('player2_id = ?'); values.push(data.player2_id); }
        if (data.state !== undefined) { updates.push('state = ?'); values.push(data.state); }
        if (data.winner_id !== undefined) { updates.push('winner_id = ?'); values.push(data.winner_id); }
        if (data.score !== undefined) { updates.push('score = ?'); values.push(data.score); }
        if (data.tournament_id !== undefined) { updates.push('tournament_id = ?'); values.push(data.tournament_id); }        

        if (updates.length === 0) {
            return false; // No data to update
        }

        updates.push('updatedAt = ?'); // Always update timestamp
        values.push(now);

        const query = `UPDATE casual_matches SET ${updates.join(', ')} WHERE id = ?`;
        values.push(id);

        const result = await db.run(query, ...values);
        return (result?.changes ?? 0) > 0;
    }

    /**
     * Deletes a casual match record by ID.
     * @param id The ID of the casual match to delete.
     * @returns True if the deletion was successful, false otherwise.
     */
    static async delete(id: number): Promise<boolean> {
        const db = await dbPromise;
        const result = await db.run(`DELETE FROM casual_matches WHERE id = ?`, id);
        return (result?.changes ?? 0) > 0;
    }
    //############################################## adding here
    /**
    * Returns all casual matches in the database.
    */
    static async findAll(): Promise<CasualMatchData[]> {
        const db = await dbPromise;
        const rows = await db.all(`SELECT * FROM casual_matches ORDER BY updatedAt DESC`);
        return rows as CasualMatchData[];
    }

    /**
    * Returns all casual matches involving a given player ID.
    * @param playerId The player's user ID.
    */
    static async findByPlayerId(playerId: number): Promise<CasualMatchData[]> {
        const db = await dbPromise;
        const rows = await db.all(
            `SELECT * FROM casual_matches WHERE player1_id = ? OR player2_id = ? ORDER BY updatedAt DESC`,
            playerId,
            playerId
        );
        return rows as CasualMatchData[];
    }
}