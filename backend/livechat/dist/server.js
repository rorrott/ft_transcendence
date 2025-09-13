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
const fastify_1 = __importDefault(require("fastify"));
const static_1 = __importDefault(require("@fastify/static"));
const path_1 = __importDefault(require("path"));
const routes_1 = require("./routes");
const sockets_1 = require("./sockets");
function buildServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const fastify = (0, fastify_1.default)({ logger: true });
        fastify.register(static_1.default, {
            root: path_1.default.join(__dirname, '../frontend'),
            prefix: '/'
        });
        try {
            yield fastify.register(routes_1.registerRoutes);
            yield fastify.ready();
            (0, sockets_1.initSockets)(fastify);
            yield fastify.listen({
                port: Number(process.env.PORT) | 3000,
                host: "0.0.0.0"
            });
        }
        catch (error) {
            console.error('Server error:', error);
            process.exit(1);
        }
    });
}
buildServer();
