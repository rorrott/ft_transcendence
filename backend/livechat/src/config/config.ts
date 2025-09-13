import { config } from 'dotenv';

config({ path: `.env.development.local` });

export const {
    JWT_SECRET
} = process.env;