"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const createMessagesTable = () => {
    const query = `
    CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
    )`;
    return new Promise((resolve, reject) => {
        database_1.default.run(query, (err) => {
            if (err) {
                console.error("Failed to create messages table:", err);
                reject(err);
            }
            else {
                console.log("Messages table created or already exists");
                resolve();
            }
        });
    });
};
exports.default = createMessagesTable;
