// backend/auth-service/src/services/user.service.ts
import { getDb } from '../plugins/sqlite.js';
import { AuthUser, NewAuthUser, SafeAuthUser } from '../models/auth.models.js';
import bcrypt from 'bcrypt';

const TABLE_NAME = 'authUser';
const BCRYPT_SALT_ROUNDS = 10;

const boolToSqlite = (value: boolean): number => (value ? 1 : 0);
const sqliteToBool = (value: number): boolean => value === 1;

/**
 * Finds a user by email, excluding sensitive fields.
 */
export const findUserByEmail = (email: string): SafeAuthUser | null => {
	const db = getDb();
	const stmt = db.prepare(`
		SELECT id, name, email, twoFactorEnabled, twoFactorMethod, createdAt, updatedAt
		FROM ${TABLE_NAME}
		WHERE email = ?
	`);
	const user = stmt.get(email) as Omit<AuthUser, 'password' | 'twoFactorSecret'> | undefined;

	if (!user) return null;

	return {
		...user,
		twoFactorEnabled: sqliteToBool(user.twoFactorEnabled as any),
		createdAt: new Date(user.createdAt * 1000).toISOString() as any,
		updatedAt: new Date(user.updatedAt * 1000).toISOString() as any,
	};
};

/**
 * Finds a user by email, including password and twoFactorSecret (for login/verification).
 */
export const findUserByEmailWithSensitiveData = (email: string): AuthUser | null => {
	const db = getDb();
	const stmt = db.prepare(`
		SELECT id, name, email, password, twoFactorEnabled, twoFactorSecret, twoFactorMethod, createdAt, updatedAt
		FROM ${TABLE_NAME}
		WHERE email = ?
	`);
	const user = stmt.get(email) as AuthUser | undefined;

	if (!user) return null;

	return {
		...user,
		twoFactorEnabled: sqliteToBool(user.twoFactorEnabled as any),
		createdAt: new Date(user.createdAt * 1000).toISOString() as any,
		updatedAt: new Date(user.updatedAt * 1000).toISOString() as any,
	};
};

/**
 * Finds a user by ID, excluding sensitive fields.
 */
export const findUserById = (id: number): SafeAuthUser | null => {
	const db = getDb();
	const stmt = db.prepare(`
		SELECT id, name, email, twoFactorEnabled, twoFactorMethod, createdAt, updatedAt
		FROM ${TABLE_NAME}
		WHERE id = ?
	`);
	const user = stmt.get(id) as Omit<AuthUser, 'password' | 'twoFactorSecret'> | undefined;

	if (!user) return null;

	return {
		...user,
		twoFactorEnabled: sqliteToBool(user.twoFactorEnabled as any),
		createdAt: new Date(user.createdAt * 1000).toISOString() as any,
		updatedAt: new Date(user.updatedAt * 1000).toISOString() as any,
	};
};

/**
 * Finds a user by ID, including password and twoFactorSecret.
 */
export const findUserByIdWithSensitiveData = (id: number): AuthUser | null => {
	const db = getDb();
	const stmt = db.prepare(`
		SELECT id, name, email, password, twoFactorEnabled, twoFactorSecret, twoFactorMethod, createdAt, updatedAt
		FROM ${TABLE_NAME}
		WHERE id = ?
	`);
	const user = stmt.get(id) as AuthUser | undefined;

	if (!user) return null;

	return {
		...user,
		twoFactorEnabled: sqliteToBool(user.twoFactorEnabled as any),
		createdAt: new Date(user.createdAt * 1000).toISOString() as any,
		updatedAt: new Date(user.updatedAt * 1000).toISOString() as any,
	};
};

/**
 * Creates a new user in the database.
 */
export const createUser = async (userData: NewAuthUser): Promise<SafeAuthUser | null> => {
	const db = getDb();
	const hashedPassword = await bcrypt.hash(userData.password, BCRYPT_SALT_ROUNDS);
	const now = Math.floor(Date.now() / 1000);

	const stmt = db.prepare(`
		INSERT INTO ${TABLE_NAME} 
		(name, email, password, twoFactorEnabled, twoFactorSecret, twoFactorMethod, createdAt, updatedAt)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`);

	try {
		const info = stmt.run(
			userData.name,
			userData.email,
			hashedPassword,
			boolToSqlite(userData.twoFactorEnabled),
			userData.twoFactorSecret ?? null,
			userData.twoFactorMethod ?? 'email', // Set a default method if not provided
			now,
			now
		);

		if (info.changes > 0) {
			return findUserByEmail(userData.email);
		}
		return null;
	} catch (error: any) {
		if (error.message.includes('UNIQUE constraint failed: authUser.email')) {
			throw new Error('Email already exists.');
		}
		throw error;
	}
};

/**
 * Updates a user's two-factor authentication secret and enabled status.
 */
export const updateUserTwoFactor = async (
	userId: number,
	secret: string | null,
	enabled: boolean
): Promise<boolean> => {
	const db = getDb();
	const now = Math.floor(Date.now() / 1000);
	const stmt = db.prepare(`
		UPDATE ${TABLE_NAME}
		SET twoFactorSecret = ?, twoFactorEnabled = ?, updatedAt = ?
		WHERE id = ?
	`);
	const info = stmt.run(secret ?? null, boolToSqlite(enabled), now, userId);
	return info.changes > 0;
};

/**
 * Deletes a user record from the database by ID.
 * @param userId The ID of the user to delete.
 * @returns True if the user was deleted, false otherwise.
 */
export const deleteUserById = (userId: number): boolean => {
    const db = getDb();
    try {
        const stmt = db.prepare(`
            DELETE FROM ${TABLE_NAME}
            WHERE id = ?
        `);
        const info = stmt.run(userId);
        return info.changes > 0;
    } catch (error) {
        console.error(`Error deleting user by ID ${userId}:`, error);
        throw error;
    }
};