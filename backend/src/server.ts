import { createApp } from './app';
import { AppDataSource } from './config/data-source';
import { env } from './config/env';

const startServer = async () => {
  await AppDataSource.initialize();

  const app = createApp();
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on port ${env.PORT}`);
  });
};

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start backend:', error);
  process.exit(1);
});
