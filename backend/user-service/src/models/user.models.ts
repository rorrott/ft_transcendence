// backend/user-service/src/models/user.models.ts
import { dbPromise } from '../plugins/sqlite.js';

export interface UserData {
    id?: number;
    name: string;
    email: string;
    avatar?: string | null;
    wins?: number;
    losses?: number;
    onlineStatus?: boolean;
    is_dummy?: boolean;
    expires_at?: number | null;
    role?: string;
    createdAt?: string;
    updatedAt?: string;
}


interface FindAllOptions {
    excludeIdsGreaterThanOrEqualTo?: number;
}

export class User {
    /**
    * Initializes the 'users' table in the database if it doesn't exist.
    */
    static async createTable() {
        const db = await dbPromise;
        await db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                avatar TEXT DEFAULT 'default-avatar.png',
                wins INTEGER DEFAULT 0,
                losses INTEGER DEFAULT 0,
                onlineStatus BOOLEAN DEFAULT false,
                is_dummy BOOLEAN DEFAULT FALSE,
                expires_at INTEGER,
                role TEXT DEFAULT 'user',
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('User table created or already exists.');
    }

    /**
    * Creates a new user record in the database.
    * For dummy users, it ensures their ID starts from 100 if the table is new or has low IDs.
    * @param data The UserData object for the new user.
    * @returns The created UserData object with ID and timestamps.
    */
    static async create(data: UserData): Promise<UserData> {
        const db = await dbPromise;
        const now = new Date().toISOString();
        let userIdToInsert = data.id;
        if (data.is_dummy && userIdToInsert === undefined) {
            const maxIdResult = await db.get(`SELECT MAX(id) as maxId FROM users`);
            const currentMaxId = maxIdResult ? (maxIdResult.maxId || 0) : 0;
            if (currentMaxId < 99) {
                userIdToInsert = 100;
                console.log(`Backend: Forcing dummy user ID to ${userIdToInsert} as current max ID is ${currentMaxId}.`);
            }
        }
        const result = await db.run(
            `INSERT INTO users (id, name, email, avatar, wins, losses, onlineStatus, is_dummy, expires_at, role, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            userIdToInsert,
            data.name,
            data.email,
            data.avatar ?? 'default-avatar.png',
            data.wins ?? 0,
            data.losses ?? 0,
            data.onlineStatus ?? false,
            data.is_dummy ?? false,
            data.expires_at ?? null,
            data.role ?? 'user',
            now,
            now
        );
        return { id: result.lastID, ...data, createdAt: now, updatedAt: now };
    }

    /**
    * Finds a user by their ID, returning a sanitized version of the data.
    * @param id The ID of the user to find.
    * @returns The sanitized UserData object or null if not found.
    */
    static async findById(id: number): Promise<Omit<UserData, 'email'> | null> {
        const user = await User._findByIdRaw(id);
        return user ? User.sanitize(user) : null;
    }

    /**
    * Internal method to find a user by ID, returning the raw data (including all fields).
    * Used internally when full data is needed (e.g., for specific operations).
    * @param id The ID of the user to find.
    * @returns The raw UserData object or null if not found.
    */
    static async _findByIdRaw(id: number): Promise<UserData | null> {
        const db = await dbPromise;
        const user = await db.get(`SELECT * FROM users WHERE id = ?`, id);
        return user ? (user as UserData) : null;
    }

    /**
    * Finds a user by their email address.
    * @param email The email of the user to find.
    * @returns The UserData object or null if not found. Note: This returns raw data.
    */
    static async findByEmail(email: string): Promise<UserData | null> {
        const db = await dbPromise;
        const user = await db.get(`SELECT * FROM users WHERE email = ?`, email);
        console.log("Raw user data from DB:", user);
        return user ? (user as UserData) : null;
    }

    /**
    * Finds a user by their ID, returning full raw data including email.
    * @param id The ID of the user to find.
    * @returns The full UserData object or null if not found.
    */
    static async findByIdWithEmail(id: number): Promise<UserData | null> {
        const db = await dbPromise;
        const user = await db.get(`SELECT * FROM users WHERE id = ?`, id);
        return user ? (user as UserData) : null;
    }

    static async findByName(name: string): Promise<UserData | null> {
        const db = await dbPromise;
        const user = await db.get(`SELECT * FROM users WHERE name = ?`, name);
        return user ? (user as UserData) : null;
    }

    /**
    * Retrieves all users from the database, excluding their email addresses.
    * @returns An array of sanitized UserData objects.
    */
    /*static async findAll(): Promise<UserData[]> {
        const db = await dbPromise;
        const users = await db.all(`SELECT * FROM users`);
        return users as UserData[];
    }*/
    /**
    * Retrieves all users from the database, applying optional filters.
    * @param options Optional filter options (e.g., excludeIdsGreaterThanOrEqualTo).
    * @returns An array of UserData objects.
    */
    static async findAll(options?: FindAllOptions): Promise<UserData[]> {
        const db = await dbPromise;
        let query = `SELECT * FROM users`;
        const params: (string | number)[] = [];
        const conditions: string[] = [];

        if (options?.excludeIdsGreaterThanOrEqualTo !== undefined) {
            conditions.push(`id < ?`); // SQL: id < 100
            params.push(options.excludeIdsGreaterThanOrEqualTo);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        console.log('DEBUG (User Model): findAll SQL Query:', query);
        console.log('DEBUG (User Model): findAll SQL Params:', params);

        const users = await db.all(query, ...params);
        return users as UserData[];
    }

    /**
    * Updates a user record by ID with partial data.
    * @param id The ID of the user to update.
    * @param data The partial UserData object with fields to update.
    * @returns True if the user was updated, false otherwise.
    */
    static async update(id: number, data: Partial<UserData>): Promise<boolean> {
        const db = await dbPromise;
        const now = new Date().toISOString();
        const updates: string[] = [];
        const values: (string | number | boolean | null)[] = [];

        if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
        if (data.email !== undefined) { updates.push('email = ?'); values.push(data.email); }
        if (data.avatar !== undefined) { updates.push('avatar = ?'); values.push(data.avatar); }
        if (data.wins !== undefined) { updates.push('wins = ?'); values.push(data.wins); }
        if (data.losses !== undefined) { updates.push('losses = ?'); values.push(data.losses); }
        if (data.onlineStatus !== undefined) { updates.push('onlineStatus = ?'); values.push(data.onlineStatus); }
        if (data.is_dummy !== undefined) { updates.push('is_dummy = ?'); values.push(data.is_dummy); } // Allow updating is_dummy
        if (data.expires_at !== undefined) { updates.push('expires_at = ?'); values.push(data.expires_at); }
        if (data.role !== undefined) { updates.push('role = ?'); values.push(data.role); }

        if (updates.length === 0)
            return false;
        updates.push('updatedAt = ?');
        values.push(now);
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        values.push(id);
        
        console.log('DEBUG (User Model): User.update SQL Query:', query);
        console.log('DEBUG (User Model): User.update SQL Values:', values);
        try {
            const result = await db.run(query, ...values);
            console.log(`DEBUG (User Model): User.update result for ID ${id}: changes = ${result?.changes}`);
            return (result?.changes ?? 0) > 0;
        } catch (error) {
            console.error(`ERROR (User Model): User.update failed for ID ${id}:`, error);
            throw error; 
        }
    }

    /**
    * Sanitizes a UserData object by omitting sensitive fields for public use.
    * @param user The UserData object to sanitize.
    * @returns A new object with sensitive fields removed.
    */
    static sanitize(user: UserData): Omit<UserData, 'email'> {
        const { email, ...sanitized } = user;
        return sanitized;
    }

    static async getLeaderboard(): Promise<Omit<UserData, 'email'>[]> {
        const db = await dbPromise;
        const users = await db.all(
            `SELECT id, name, avatar, wins, losses FROM users ORDER BY wins DESC, losses ASC`
        );
        return users as Omit<UserData, 'email'>[];
    }

    static async delete(id: number): Promise<boolean> {
        const db = await dbPromise;
        console.log(`DEBUG: Attempting to delete user with ID ${id}`);
        try {
            const result = await db.run(`DELETE FROM users WHERE id = ?`, id);
            console.log(`DEBUG: DELETE result:`, result);
            console.log(`DEBUG: Rows affected:`, result?.changes);
            return (result?.changes ?? 0) > 0;
        } catch (error) {
            console.error(`ERROR: Failed to delete user with ID ${id}:`, error);
            throw error; 
        }
    }
}
