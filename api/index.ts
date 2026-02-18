// Vercel Serverless Function — wraps the Express app
// Environment variables are provided by Vercel dashboard (no dotenv needed)
import { createApp } from '../server/src/app';

const app = createApp();

export default app;
