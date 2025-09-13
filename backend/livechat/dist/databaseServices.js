"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAllDbAsync = findAllDbAsync;
exports.getDbAsync = getDbAsync;
exports.runDbAsync = runDbAsync;
const initDatabase_1 = require("./initDatabase");
function findAllDbAsync(sql, parameters) {
    return new Promise((resolve, reject) => {
        initDatabase_1.db.all(sql, parameters, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
}
function getDbAsync(sql, parameters) {
    return new Promise((resolve, reject) => {
        initDatabase_1.db.get(sql, parameters, (err, row) => {
            if (err)
                reject(err);
            else
                resolve(row);
        });
    });
}
function runDbAsync(sql, parameters) {
    return new Promise((resolve, reject) => {
        initDatabase_1.db.run(sql, parameters, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
