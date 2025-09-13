//backend/tournament-service/src/model/tournament.models.ts
import { dbPromise } from '../plugins/sqlite.js';

export interface TournamentData {
    id?: number;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

export class Tournament {
    /**
     * Initializes the 'tournaments' table in the database if it doesn't exist.
     */
    static async createTable() {
        const db = await dbPromise;
        await db.run(`
            CREATE TABLE IF NOT EXISTS tournaments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Tournament table created or already exists.');
    }
    /**
     * Creates a new tournament record.
     * @param data The TournamentData object to create (excluding id, timestamps).
     * @returns The created TournamentData object with ID and timestamps.
     */
    static async create(data: Omit<TournamentData, 'id' | 'createdAt' | 'updatedAt'>): Promise<TournamentData> {
        const db = await dbPromise;
        const now = new Date().toISOString();

        const result = await db.run(
            `INSERT INTO tournaments (name, createdAt, updatedAt)
             VALUES (?, ?, ?)`,
            data.name,
            now,
            now
        );
        return { id: result.lastID, ...data, createdAt: now, updatedAt: now };
    }
    /**
     * Finds a tournament by its ID.
     * @param id The ID of the tournament.
     * @returns The TournamentData object or null if not found.
     */
    static async findById(id: number): Promise<TournamentData | null> {
        const db = await dbPromise;
        const tournament = await db.get(`SELECT * FROM tournaments WHERE id = ?`, id);
        return tournament ? (tournament as TournamentData) : null;
    }
    /**
     * Finds a tournament by its name.
     * @param name The name of the tournament.
     * @returns The TournamentData object or null if not found.
     */
    static async findByName(name: string): Promise<TournamentData | null> {
        const db = await dbPromise;
        const tournament = await db.get(`SELECT * FROM tournaments WHERE name = ?`, name);
        return tournament ? (tournament as TournamentData) : null;
    }
    /**
     * Finds all tournaments.
     * @returns An array of TournamentData objects.
     */
    static async findAll(): Promise<TournamentData[]> {
        const db = await dbPromise;
        const tournaments = await db.all(`SELECT * FROM tournaments`);
        return tournaments as TournamentData[];
    }
    /**
     * Updates a tournament record by ID.
     * @param id The ID of the tournament to update.
     * @param data The partial TournamentData object with fields to update.
     * @returns True if the update was successful, false otherwise.
     */
    static async update(id: number, data: Partial<TournamentData>): Promise<boolean> {
        const db = await dbPromise;
        const now = new Date().toISOString();

        const updates: string[] = [];
        const values: (string | number)[] = [];

        if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
        if (updates.length === 0) {
            return false; // No data to update
        }
        updates.push('updatedAt = ?');
        values.push(now);
        const query = `UPDATE tournaments SET ${updates.join(', ')} WHERE id = ?`;
        values.push(id);
        const result = await db.run(query, ...values);
        return (result?.changes ?? 0) > 0;
    }
    /**
     * Deletes a tournament record by ID.
     * @param id The ID of the tournament to delete.
     * @returns True if the deletion was successful, false otherwise.
     */
    static async delete(id: number): Promise<boolean> {
        const db = await dbPromise;
        const result = await db.run(`DELETE FROM tournaments WHERE id = ?`, id);
        return (result?.changes ?? 0) > 0;
    }
}
