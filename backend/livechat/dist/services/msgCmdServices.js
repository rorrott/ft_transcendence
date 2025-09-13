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
exports.blockUser = blockUser;
exports.unblockUser = unblockUser;
exports.createRoomInRoomService = createRoomInRoomService;
exports.msgCmdCheck = msgCmdCheck;
const databaseServices_1 = require("../databaseServices");
function blockUser(blocker_user, blocked_user) {
    return __awaiter(this, void 0, void 0, function* () {
        const blocked = yield (0, databaseServices_1.getDbAsync)(`SELECT * FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?`, [blocker_user, blocked_user]);
        if (!blocked) {
            try {
                yield (0, databaseServices_1.runDbAsync)(`INSERT INTO blocked_users (blocked_id, blocker_id) VALUES (?,?)`, [blocker_user, blocked_user]);
                return ({ error: null, replyMessage: "User is succesfully blocked.", isCommand: true });
            }
            catch (error) {
                return ({ error: error, replyMessage: "Error occured while inserting blocked_users", isCommand: true });
            }
        }
        else {
            return ({ error: null, replyMessage: "User is already blocked", isCommand: true });
        }
    });
}
function unblockUser(blocker_user, blocked_user) {
    return __awaiter(this, void 0, void 0, function* () {
        const blocked = yield (0, databaseServices_1.getDbAsync)(`SELECT * FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?`, [blocker_user, blocked_user]);
        if (blocked) {
            try {
                yield (0, databaseServices_1.runDbAsync)(`DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?`, [blocker_user, blocked_user]);
                console.log("user is succesfully UNBLOCKED");
                return ({ error: null, replyMessage: "User is succesfully unblocked.", isCommand: true });
            }
            catch (error) {
                console.error("USER COULDNT UNBLOCKED");
                return ({ error: error, replyMessage: "Error occured while deleting blocked_users", isCommand: true });
            }
        }
        else {
            return ({ error: null, replyMessage: "User is not blocked", isCommand: true });
        }
    });
}
function createRoomInRoomService() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("http://localhost:6001/create-room", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            //TO-DO: if(!res.ok)
            const data = yield res.json();
            return {
                error: null,
                replyMessage: data.roomName,
                isCommand: true,
            };
        }
        catch (error) {
            return {
                error: error,
                replyMessage: "Error",
                isCommand: true,
            };
        }
    });
}
function msgCmdCheck(msg, sender_id, receiver_id) {
    return __awaiter(this, void 0, void 0, function* () {
        if (msg.startsWith('/block')) {
            console.error("BLOCK TRIGERERERED");
            const result = yield blockUser(sender_id, receiver_id);
            return result;
        }
        else if (msg.startsWith('/pardon')) {
            const result = yield unblockUser(sender_id, receiver_id);
            console.error("PARDON TRIGERERERED");
            result.isCommand = true;
            return result;
        }
        else if (msg.startsWith('/invite')) {
            const result = createRoomInRoomService();
            console.error("INVITE TRIGERERERED");
            return result;
        }
        else {
            return ({ error: null, replyMessage: "It is not a command", isCommand: false });
        }
    });
}
