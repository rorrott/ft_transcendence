import Fastify, {FastifyInstance ,FastifyReply, FastifyRequest } from "fastify"
import jwt from '@fastify/jwt';
import { JWT_SECRET } from "./config/config";

export async function registerAuth(fastify: FastifyInstance) {
  if (!JWT_SECRET)
  {
    process.exit(1)
  }
  fastify.register(jwt, {
    secret: JWT_SECRET,
  });

  fastify.decorate("authenticate", async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });
}
