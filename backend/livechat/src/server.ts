import Fastify, { FastifyReply, FastifyRequest } from "fastify"
import jwt from '@fastify/jwt';
import { registerRoutes } from "./routes"
import { initSockets } from "./sockets"
import { db } from "./initDatabase"
import { registerAuth } from "./registerAuth";

async function buildServer() {
    
    const fastify = Fastify({logger: true})

    try {
        await registerAuth(fastify)
        await fastify.register(registerRoutes)
        await fastify.ready()
        console.log("Registering sockets...")
        initSockets(fastify)
        await fastify.listen({
        port: 6002,
        host: "0.0.0.0"
    })
    } catch (error) {
        console.error('Server error:', error);
        process.exit(1);
    }
    
}

buildServer()