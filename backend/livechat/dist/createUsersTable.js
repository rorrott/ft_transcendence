"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//backend/auth-service/src/migration/createUsersTable.ts
const database_1 = __importDefault(require("./database"));
const createUsersTable = () => {
    const query = `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        reset_token TEXT,
        reset_token_expiry INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    return new Promise((resolve, reject) => {
        database_1.default.run(query, (err) => {
            if (err) {
                console.error("Failed to create users table:", err);
                reject(err);
            }
            else {
                console.log("Users table created or already exists");
                resolve();
            }
        });
    });
};
exports.default = createUsersTable;
