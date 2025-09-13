export const blockUserSchema = {
  body: {
    type: 'object',
    required: ['user', 'blocked_user'],
    properties: {
      user: { type: 'string' },
      blocked_user: { type: 'string' },
    },
  },
};

export interface BlockUserBody {
    user: string,
    blocked_user: string
}