//backend/tournament-service/src/plugins/sqlite.ts
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../../database/tournament.sqlite');

sqlite3.verbose();
// A promise that resolves with the database instance once opened
export const dbPromise: Promise<Database> = open({
    filename: DB_PATH,
    driver: sqlite3.Database
});

// A variable to hold the database instance once connected
let db: Database | null = null;

/**
 * Connects to the SQLite database and initializes all necessary tables.
 * This function should be called once at application startup.
 */
export const connectToDatabase = async () => {
    try {
        db = await dbPromise; // Await the connection
        console.log('Connected to SQLite Tournament database');
        // Dynamically import model classes and call their createTable methods
        const { Tournament } = await import('../models/tournament.models.js');
        const { PlayerTournament } = await import('../models/playerTournament.models.js');
        const { TournamentMatch } = await import('../models/tournamentMatch.models.js');
        const { CasualMatch } = await import('../models/casualMatch.models.js');

        await Tournament.createTable();
        await PlayerTournament.createTable();
        await TournamentMatch.createTable();
        await CasualMatch.createTable();

        console.log('Tournament database tables initialized.');
    } catch (err) {
        console.error('Failed to connect or initialize Tournament database:', err);
        // It's crucial to exit the process if the database cannot be initialized
        process.exit(1);
    }
};
/**
 * Returns the connected database instance.
 * Throws an error if the database has not been connected yet.
 */
export const getDb = (): Database => {
    if (!db) {
        throw new Error('Database not connected. Call connectToDatabase first.');
    }
    return db;
};
























/*import { Sequelize } from 'sequelize';
import { initTournamentModel } from '../models/tournament.models';
import { initPlayerTournamentModel } from '../models/playerTournament.models';
import { initTournamentMatchModel } from '../models/tournamentMatch.models';
import { initCasualMatchModel } from '../models/casualMatch.models';

export const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: './database/tournament.sqlite',
	logging: false,
});

export const connectToDatabase = async () => {
	try {
		await sequelize.authenticate();
		initTournamentModel();
		initPlayerTournamentModel();
		initTournamentMatchModel();
        initCasualMatchModel();;
		await sequelize.sync();
		console.log('Connected to Tournament database');
	} catch (err) {
		console.error('Failed to connect:', err);
		process.exit(1);
	}
};

export default sequelize;*/
