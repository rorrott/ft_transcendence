import sqlite3 from 'sqlite3';
import path from 'path';

export type Database = sqlite3.Database;

const dbPath = path.resolve(__dirname, '../database/livechat.db.sqlite');
export const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to SQLite database.');
    }

    db.run(`CREATE TABLE IF NOT EXISTS blocked_users (id INTEGER PRIMARY KEY AUTOINCREMENT, blocker_id INTEGER, blocked_id INTEGER)`, (err) => {
        if (err)
            console.log('Error creating blocked_user table')
        else
            console.log('blocked_user table created succesfully')
    })

     db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);`, (err: Error) => {
        if (err)
            console.log('Error creating blocked_user table')
        else
            console.log('messages table created succesfully')
    })
});

