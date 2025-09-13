"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockUserSchema = void 0;
exports.blockUserSchema = {
    body: {
        type: 'object',
        required: ['user', 'blocked_user'],
        properties: {
            user: { type: 'string' },
            blocked_user: { type: 'string' },
        },
    },
};
