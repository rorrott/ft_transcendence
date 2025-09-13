//backend/auth-service/src/services/otp.service.ts
import { getDb } from '../plugins/sqlite.js';

const OTP_EXPIRATION_SECONDS = 300; // 5 minutes

/**
 * Store an OTP code for a user in the database.
 */
export async function storeOtp(userId: number, code: string): Promise<boolean> {
	try {
		const db = getDb();
		const now = Math.floor(Date.now() / 1000);
		const expiresAt = now + OTP_EXPIRATION_SECONDS;
		const stmt = db.prepare(`
			INSERT INTO otp_codes (user_id, code, expires_at)
			VALUES (?, ?, ?)
		`);
		stmt.run(userId, code, expiresAt);
		return true;
	} catch (error) {
		console.error('Failed to store OTP code:', error);
		return false;
	}
}

/**
 * Retrieve the most recent valid OTP code for a user.
 */
export const getStoredOtp = (userId: number): string | null => {
	const db = getDb();
	const stmt = db.prepare(`
		SELECT code, expires_at FROM otp_codes
		WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
	`);
	const row = stmt.get(userId) as { code: string; expires_at: number } | undefined;
	if (!row) return null;
	const currentTime = Math.floor(Date.now() / 1000);
	if (row.expires_at < currentTime)
		return null;
	return row.code;
};

