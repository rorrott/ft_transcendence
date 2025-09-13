//backend/user-service/src/plugins/sqlite.ts
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../database/user.sqlite');

sqlite3.verbose();

const dbPromise: Promise<Database> = open({
	filename: DB_PATH,
	driver: sqlite3.Database
});

let db: Database | null = null;

export const connectToUserDatabase = async () => {
	try {
		db = await dbPromise;
		console.log('Connected to SQLite User database');
		const { User } = await import('../models/user.models.js');
		const { Friendship } = await import('../models/friendship.models.js');
		const { Match } = await import('../models/match.models.js');
		await User.createTable();
		await Friendship.createTable();
		await Match.createTable();
		console.log('User database tables initialized');
	} catch (err) {
		console.error('Failed to connect or initialize User database:', err);
		process.exit(1);
	}
};

export { dbPromise };
export const getDb = (): Database => {
	if (!db)
		throw new Error('Database not connected. Call connectToUserDatabase first.');
	return db;
};
