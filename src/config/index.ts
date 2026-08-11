import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  IMGBB_API_KEY: z.string().min(1),
  DEV_MOCK_TOKEN: z.string().optional(),
  DEV_MOCK_USER_ID: z.string().optional(),
  DEV_MOCK_EMAIL: z.string().optional(),
  DEV_MOCK_ROLE: z.enum(['USER', 'ADMIN']).optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('[config] Invalid environment variables:', parsedEnv.error.issues);
  throw new Error('Invalid environment variables');
}

export const config = {
  port: parsedEnv.data.PORT,
  nodeEnv: parsedEnv.data.NODE_ENV,
  clientUrl: parsedEnv.data.CLIENT_URL,
  databaseUrl: parsedEnv.data.DATABASE_URL,
  directUrl: parsedEnv.data.DIRECT_URL,
  imgbbApiKey: parsedEnv.data.IMGBB_API_KEY,
  devMock: {
    token: parsedEnv.data.DEV_MOCK_TOKEN ?? 'dev-token',
    userId: parsedEnv.data.DEV_MOCK_USER_ID ?? 'dev-user-id',
    email: parsedEnv.data.DEV_MOCK_EMAIL ?? 'dev@techgear.test',
    role: parsedEnv.data.DEV_MOCK_ROLE ?? 'ADMIN',
  },
};
