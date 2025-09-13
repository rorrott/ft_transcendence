//backend/user-service/src/models/friendship.models.ts
import { dbPromise } from '../plugins/sqlite.js';

type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

// Define the interface for Friendship data
export interface FriendshipData {
	id?: number;
	userId: number;
	friendId: number;
	status: FriendshipStatus;
	createdAt?: string;
	updatedAt?: string;
}

export class Friendship {
	/**
	 * Initializes the 'friendships' table in the database if it doesn't exist.
   	*/
	static async createTable() {
		const db = await dbPromise;
		await db.run(`
			CREATE TABLE IF NOT EXISTS friendships (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				userId INTEGER NOT NULL,
				friendId INTEGER NOT NULL,
				status TEXT NOT NULL DEFAULT 'pending',
				createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
				updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
				FOREIGN KEY (friendId) REFERENCES users(id) ON DELETE CASCADE,
				CONSTRAINT unique_friendship UNIQUE (userId, friendId),
				CONSTRAINT check_status CHECK (status IN ('pending', 'accepted', 'declined', 'blocked'))
			);
		`);
		// Add an index to speed up lookups by userId or friendId
		await db.run(`CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships (userId);`);
		await db.run(`CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships (friendId);`);
		console.log('Friendship table created or already exists.');
	}
	/**
   		* Creates a new friendship record.
   		* @param data The FriendshipData object to create.
   		* @returns The created FriendshipData object with ID and timestamps.
   	*/
	static async create(data: Omit<FriendshipData, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: FriendshipStatus }): Promise<FriendshipData> {
		const db = await dbPromise;
		const now = new Date().toISOString();
		const status = data.status ?? 'pending';
		const result = await db.run(
			`INSERT INTO friendships (userId, friendId, status, createdAt, updatedAt)
			 VALUES (?, ?, ?, ?, ?)`,
			data.userId,
			data.friendId,
			status,
			now,
			now
		);
		return { id: result.lastID, userId: data.userId, friendId: data.friendId, status, createdAt: now, updatedAt: now };
	}

	/**
   		* Finds a friendship record by its ID.
   		* @param id The ID of the friendship.
   		* @returns The FriendshipData object or null if not found.
   	*/
	static async findById(id: number): Promise<FriendshipData | null> {
		const db = await dbPromise;
		const friendship = await db.get(`SELECT * FROM friendships WHERE id = ?`, id);
		return friendship ? (friendship as FriendshipData) : null;
	}
	/**
   		* Finds a friendship record between two specific users, regardless of initiation order.
   		* This is useful for checking if a relationship already exists.
   		* @param userAId ID of the first user.
   		* @param userBId ID of the second user.
   		* @returns The FriendshipData object or null if not found.
   	*/
	static async findByUserAndFriend(userAId: number, userBId: number): Promise<FriendshipData | null> {
		const db = await dbPromise;
		const friendship = await db.get(
			`SELECT * FROM friendships WHERE (userId = ? AND friendId = ?) OR (userId = ? AND friendId = ?)`,
			userAId, userBId, userBId, userAId
		);
		return friendship ? (friendship as FriendshipData) : null;
	}
	/**
		* Finds all friendship records (sent, received, accepted, blocked) for a given user ID.
		* @param userId The ID of the user.
		* @returns An array of FriendshipData objects.
	*/
	static async findFriendsForUser(userId: number): Promise<FriendshipData[]> {
		const db = await dbPromise;
		const friendships = await db.all(
			`SELECT * FROM friendships WHERE userId = ? OR friendId = ?`,
			userId, userId
		);
		return friendships as FriendshipData[];
	}
	/**
		* Updates the status of a specific friendship.
		* @param id The ID of the friendship to update.
		* @param newStatus The new status ('pending', 'accepted', 'declined', 'blocked').
		* @returns True if the update was successful, false otherwise.
	*/
	static async updateStatus(id: number, newStatus: FriendshipStatus): Promise<boolean> {
		const db = await dbPromise;
		const now = new Date().toISOString();
		const result = await db.run(
			`UPDATE friendships SET status = ?, updatedAt = ? WHERE id = ?`,
			newStatus, now, id
		);
		return (result?.changes ?? 0) > 0;
	}
	/**
		* Deletes a friendship record by ID.
		* @param id The ID of the friendship to delete.
		* @returns True if the deletion was successful, false otherwise.
	*/
	static async delete(id: number): Promise<boolean> {
		const db = await dbPromise;
		const result = await db.run(`DELETE FROM friendships WHERE id = ?`, id);
		return (result?.changes ?? 0) > 0;
	}
	static async deleteFriendshipsByUser(userId: number): Promise<boolean> {
		const db = await dbPromise;
		// Deletes friendships where the user is either the inviter or the friend
		const result = await db.run(
			`DELETE FROM friendships WHERE userId = ? OR friendId = ?`,
			userId, userId
		);
		return (result?.changes ?? 0) > 0;
	}
}
