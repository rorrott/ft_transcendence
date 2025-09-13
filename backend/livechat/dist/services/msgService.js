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
exports.sendMessageToSocket = sendMessageToSocket;
const databaseServices_1 = require("../databaseServices");
const msgCmdServices_1 = require("./msgCmdServices");
const databaseService_1 = require("./databaseService");
const sockets_1 = require("../sockets");
function sendMessageToSocket(io, userId, to, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        const targetSocket = sockets_1.onlineUserSockets.get(to);
        if (targetSocket) {
            const cmdResult = yield (0, msgCmdServices_1.msgCmdCheck)(msg, userId, to);
            if (cmdResult.error) {
                console.error("there is an error");
                console.log(cmdResult.error);
                throw cmdResult.error;
            }
            if (!cmdResult.isCommand) {
                const isBlock = yield (0, databaseService_1.isBlocked)(userId, to);
                if (!isBlock) {
                    io.to(targetSocket.id).emit('get-chat-message', {
                        from: userId,
                        msg: msg
                    });
                }
            }
            else {
                const isBlock = yield (0, databaseService_1.isBlocked)(userId, to);
                if (!isBlock) {
                    io.to(targetSocket.id).emit('emit-invite-message', {
                        from: userId,
                        roomName: cmdResult.replyMessage
                    });
                    io.to(sockets_1.onlineUserSockets.get(userId).id).emit('emit-invite-message', {
                        from: "server",
                        roomName: cmdResult.replyMessage
                    });
                }
            }
        }
        //TO-DO database check if user exists
        try {
            yield (0, databaseServices_1.runDbAsync)(`INSERT INTO messages (sender_id, receiver_id, message)
                        VALUES (?, ?, ?)`, [userId, to, msg]);
            console.log("Message stored in DB");
        }
        catch (err) {
            console.error("Failed to insert message:", err);
            throw err;
        }
    });
}
