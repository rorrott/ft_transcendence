// backend/auth-service/src/plugins/db.ts
import { connectToDatabase } from './sqlite.js';

export const connectAndInitDb = async () => {
	try {
		connectToDatabase(); 
		console.log('Auth database connected and initialized.');
	} catch (err) {
		console.error('Failed to connect and initialize database:', err);
		process.exit(1);
	}
};

export { getDb } from './sqlite.js';