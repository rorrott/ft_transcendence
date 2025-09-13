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
exports.registerRoutes = registerRoutes;
const blockUser_schemas_1 = require("./schemas/blockUser.schemas");
const databaseServices_1 = require("./databaseServices");
const msgCmdServices_1 = require("./services/msgCmdServices");
function registerRoutes(fastify) {
    return __awaiter(this, void 0, void 0, function* () {
        fastify.get("/", (req, res) => {
            return ({ message: "hello" });
        });
        fastify.get('/messages/:user1/:user2', (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { user1, user2 } = req.params;
            try {
                const messages = yield (0, databaseServices_1.findAllDbAsync)(`SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? and receiver_id = ?)`, [user1, user2, user2, user1]);
                reply.send(messages);
            }
            catch (err) {
                console.error(err);
                reply.status(500).send({ error: 'Database error' });
            }
        }));
        fastify.get("/chat", (req, reply) => {
            reply.type('text/html').sendFile('index.html');
        });
        fastify.post("/blockuser", { schema: blockUser_schemas_1.blockUserSchema }, (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { user, blocked_user } = req.body;
            const blocker_user = user;
            const result = yield (0, msgCmdServices_1.blockUser)(blocker_user, blocked_user);
            if (result.error) {
                reply.send({ message: result.error });
            }
            else {
                reply.send({ message: result.replyMessage });
            }
        }));
    });
}
