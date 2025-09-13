export const getMessagesSchema = {
  body: {
    type: 'object',
    required: ['user1', 'user2'],
    properties: {
      user1: { type: 'string' },
      user2: { type: 'string' },
    },
  },
};

export interface GetMessagesBody {
    user1: string,
    user2: string
}