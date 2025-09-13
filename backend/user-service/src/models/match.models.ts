//backend/user-service/src/models/match.models.ts
import { dbPromise } from '../plugins/sqlite.js';

export interface MatchData {
  id?: number;
  player1Id: number;
  player2Id: number;
  winnerId: number;
  player1Score: number;
  player2Score: number;
  playedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class Match {
    /**
        * Initializes the 'matches' table in the database if it doesn't exist.
    */
    static async createTable() {
        const db = await dbPromise;
        await db.run(`
            CREATE TABLE IF NOT EXISTS matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player1Id INTEGER NOT NULL,
                player2Id INTEGER NOT NULL,
                winnerId INTEGER NOT NULL,
                player1Score INTEGER NOT NULL DEFAULT 0,
                player2Score INTEGER NOT NULL DEFAULT 0,
                playedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (player1Id) REFERENCES users(id) ON DELETE RESTRICT,
                FOREIGN KEY (player2Id) REFERENCES users(id) ON DELETE RESTRICT,
                FOREIGN KEY (winnerId) REFERENCES users(id) ON DELETE RESTRICT
            );
        `);
        // Add indexes for common lookup fields to improve performance
        await db.run(`CREATE INDEX IF NOT EXISTS idx_matches_player1_id ON matches (player1Id);`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_matches_player2_id ON matches (player2Id);`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_matches_winner_id ON matches (winnerId);`);
        console.log('Match table created or already exists.');
    }
    /**
        * Creates a new match record in the database.
        * @param data The MatchData object for the new match.
        * @returns The created MatchData object with ID and timestamps.
    */
    static async create(data: Omit<MatchData, 'id' | 'createdAt' | 'updatedAt' | 'playedAt'> & { playedAt?: string }): Promise<MatchData> {
        const db = await dbPromise;
        const now = new Date().toISOString();
        const playedAt = data.playedAt ?? now;

        const result = await db.run(
            `INSERT INTO matches (player1Id, player2Id, winnerId, player1Score, player2Score, playedAt, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            data.player1Id,
            data.player2Id,
            data.winnerId,
            data.player1Score ?? 0,
            data.player2Score ?? 0,
            playedAt,
            now,
            now
        );
        return { id: result.lastID, ...data, playedAt, createdAt: now, updatedAt: now };
    }
    /**
        * Finds a match by its ID.
        * @param id The ID of the match to find.
        * @returns The MatchData object or null if not found.
    */
    static async findById(id: number): Promise<MatchData | null> {
        const db = await dbPromise;
        const match = await db.get(`SELECT * FROM matches WHERE id = ?`, id);
        return match ? (match as MatchData) : null;
    }
    /**
        * Finds all matches where a specific player was involved (as player1 or player2).
        * @param playerId The ID of the player.
        * @returns An array of MatchData objects.
    */
    static async findMatchesByPlayer(playerId: number): Promise<MatchData[]> {
        const db = await dbPromise;
        const matches = await db.all(
            `SELECT * FROM matches WHERE player1Id = ? OR player2Id = ? ORDER BY playedAt DESC`,
            playerId, playerId
        );
        return matches as MatchData[];
    }
    /**
        * Finds all matches won by a specific player.
        * @param winnerId The ID of the winning player.
        * @returns An array of MatchData objects.
    */
    static async findMatchesWonByPlayer(winnerId: number): Promise<MatchData[]> {
        const db = await dbPromise;
        const matches = await db.all(
            `SELECT * FROM matches WHERE winnerId = ? ORDER BY playedAt DESC`,
            winnerId
        );
        return matches as MatchData[];
    }
    /**
        * Updates a match record by ID with partial data.
        * @param id The ID of the match to update.
        * @param data The partial MatchData object with fields to update.
        * @returns True if the match was updated, false otherwise.
    */
    static async update(id: number, data: Partial<MatchData>): Promise<boolean> {
        const db = await dbPromise;
        const now = new Date().toISOString();

        const updates: string[] = [];
        const values: (string | number)[] = [];

        if (data.player1Id !== undefined) { updates.push('player1Id = ?'); values.push(data.player1Id); }
        if (data.player2Id !== undefined) { updates.push('player2Id = ?'); values.push(data.player2Id); }
        if (data.winnerId !== undefined) { updates.push('winnerId = ?'); values.push(data.winnerId); }
        if (data.player1Score !== undefined) { updates.push('player1Score = ?'); values.push(data.player1Score); }
        if (data.player2Score !== undefined) { updates.push('player2Score = ?'); values.push(data.player2Score); }
        if (data.playedAt !== undefined) { updates.push('playedAt = ?'); values.push(data.playedAt); }
        if (updates.length === 0)
            return false;
        updates.push('updatedAt = ?');
        values.push(now);
        const query = `UPDATE matches SET ${updates.join(', ')} WHERE id = ?`;
        values.push(id);
        const result = await db.run(query, ...values);
        return (result?.changes ?? 0) > 0;
    }
    /**
        * Deletes a match record by ID.
        * @param id The ID of the match to delete.
        * @returns True if the deletion was successful, false otherwise.
    */
    static async delete(id: number): Promise<boolean> {
        const db = await dbPromise;
        const result = await db.run(`DELETE FROM matches WHERE id = ?`, id);
        return (result?.changes ?? 0) > 0;
    }
    static async deleteMatchesByPlayer(userId: number): Promise<boolean> {
        const db = await dbPromise;
        // Deletes matches where the user is player1, player2, or the winner
        const result = await db.run(
            `DELETE FROM matches WHERE player1Id = ? OR player2Id = ? OR winnerId = ?`,
            userId, userId, userId
        );
        return (result?.changes ?? 0) > 0;
    }
}
