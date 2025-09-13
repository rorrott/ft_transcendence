"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
//TO-DO delete
sqlite3_1.default.verbose();
const dbPath = path_1.default.resolve(__dirname, '../database/livechat.db.sqlite');
exports.db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    }
    else {
        console.log('Connected to SQLite database.');
    }
    exports.db.run(`CREATE TABLE IF NOT EXISTS blocked_users (id INTEGER PRIMARY KEY AUTOINCREMENT, blocker_id INTEGER, blocked_id INTEGER)`, (err) => {
        if (err)
            console.log('Error creating blocked_user table');
        else
            console.log('blocked_user table created succesfully');
    });
    exports.db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);`, (err) => {
        if (err)
            console.log('Error creating blocked_user table');
        else
            console.log('messages table created succesfully');
    });
});
