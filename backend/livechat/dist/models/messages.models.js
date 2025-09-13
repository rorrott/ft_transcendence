"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const sequelize_init_1 = require("../sequelize_init");
class Message extends sequelize_1.Model {
}
Message.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    sender_id: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    receiver_id: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    timestamp: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: sequelize_init_1.sequelize,
    tableName: 'messages',
    timestamps: false,
});
exports.default = Message;
