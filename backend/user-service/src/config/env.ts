//backend/user-service/src/config/env.ts
import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });
export const { PORT, NODE_ENV, JWT_SECRET } = process.env;