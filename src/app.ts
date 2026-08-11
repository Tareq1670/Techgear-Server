import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { notFound, errorHandler } from './middlewares/error';
import { sendResponse } from './lib/response';

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  sendResponse(res, 200, true, 'TechGear API is running');
});

app.get('/health', (_req: Request, res: Response) => {
  sendResponse(res, 200, true, 'Server is healthy');
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
