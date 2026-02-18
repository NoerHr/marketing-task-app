import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { startScheduler } from './scheduler';

const PORT = process.env.PORT || 3001;

const app = createApp();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  startScheduler();
});
