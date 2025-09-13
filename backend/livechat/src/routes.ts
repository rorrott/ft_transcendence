import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { BlockUserBody, blockUserSchema } from "./schemas/blockUser.schemas";
import { GetMessagesBody, getMessagesSchema } from "./schemas/createMessage.schemas";
import { findAllDbAsync, getDbAsync, runDbAsync } from "./databaseServices";
import { blockUser } from "./services/msgCmdServices";
import { CommandResult } from "./interfaces/types";
import { onlineUserSockets } from "./sockets";

export async function registerRoutes(fastify: FastifyInstance)
{
    fastify.get("/api/",(req: FastifyRequest,res: FastifyReply) => {
        return ({message: "hello"})
    })


fastify.get('/api/messages/:user2', {preValidation: fastify.authenticate} ,async (req: FastifyRequest, reply: FastifyReply) => {
  const { user2 } = req.params as { user2: string };
  const user = req.user as { userName: string };

  try {
    const messages: Message[] = await findAllDbAsync(`SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? and receiver_id = ?)`, [user.userName,user2,user2,user.userName])
    reply.send(messages);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Database error' });
  }
});


fastify.get('/api/getOnlineFriends', { preValidation: fastify.authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
  const onlineUserIds = Array.from(onlineUserSockets.values()).map(entry => entry.userId);
  reply.type('application/json').send({ data: onlineUserIds });
});

fastify.post("/blockuser",{schema: blockUserSchema, preValidation: fastify.authenticate}, async (req: FastifyRequest,reply: FastifyReply) => {
    const { blocked_user } = req.body as { user: string, blocked_user: string };
    const blocker_user = req.user as { userName: string };
    
    const result: CommandResult = await blockUser(blocker_user.userName,blocked_user)

    if (result.error)
    {
      reply.send({message: result.error})
    }
    else
    {
      reply.send({message:result.replyMessage})
    }
})
}