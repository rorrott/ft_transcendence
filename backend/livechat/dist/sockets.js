"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onlineUserSockets = void 0;
exports.initSockets = initSockets;
const socket_io_1 = require("socket.io");
const msgService_1 = require("./services/msgService");
exports.onlineUserSockets = new Map;
function initSockets(fastify) {
    return __awaiter(this, void 0, void 0, function* () {
        const io = new socket_io_1.Server(fastify.server);
        io.on('connection', (socket) => {
            const userId = socket.handshake.auth.userId;
            exports.onlineUserSockets.set(userId, socket);
            console.log(userId + ' (' + exports.onlineUserSockets.get(userId) + ') ' + 'connected');
            socket.join(userId);
            socket.on('disconnect', () => {
                console.log(userId + ' (' + exports.onlineUserSockets.get(userId) + ') ' + 'disconnected');
                exports.onlineUserSockets.delete(userId);
            });
            socket.on('emit-chat-message', (_a) => __awaiter(this, [_a], void 0, function* ({ to, msg }) {
                console.log(userId + " " + to + " " + msg);
                try {
                    yield (0, msgService_1.sendMessageToSocket)(io, userId, to, msg);
                }
                catch (error) {
                    console.log(error);
                }
            }));
        });
    });
}
