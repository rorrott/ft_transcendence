"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dbPath = path_1.default.resolve(__dirname, '../database/users.db.sqlite');
fs_1.default.mkdirSync(path_1.default.dirname(dbPath), { recursive: true });
const db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err)
        console.error('DB error:', err.message);
    else
        console.log('Connected to Auth DB');
});
exports.default = db;
