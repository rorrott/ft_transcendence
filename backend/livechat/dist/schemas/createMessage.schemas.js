"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessagesSchema = void 0;
exports.getMessagesSchema = {
    body: {
        type: 'object',
        required: ['user1', 'user2'],
        properties: {
            user1: { type: 'string' },
            user2: { type: 'string' },
        },
    },
};
