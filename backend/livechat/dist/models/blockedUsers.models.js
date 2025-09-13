"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const sequelize_init_1 = require("../sequelize_init");
class BlockedUser extends sequelize_1.Model {
}
BlockedUser.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    blocker_id: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    blocked_id: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    }
}, {
    sequelize: sequelize_init_1.sequelize,
    tableName: 'blocked_users',
    timestamps: false,
});
exports.default = BlockedUser;
