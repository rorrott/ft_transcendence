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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBlocked = isBlocked;
const sequelize_1 = require("sequelize");
const blockedUsers_models_1 = __importDefault(require("./models/blockedUsers.models"));
function isBlocked(sender_id, receiver_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const blocked = yield blockedUsers_models_1.default.findOne({
            where: {
                [sequelize_1.Op.or]: [
                    { blocked_id: sender_id, blocker_id: receiver_id }
                ],
            },
            attributes: ['id'],
        });
        return !!blocked;
    });
}
