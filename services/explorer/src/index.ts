import { startConsumer } from './consumer.js';

startConsumer()
  .then(() => console.log('Explorer service started.'))
  .catch((err) => {
    console.error('Failed to start Explorer service:', err);
    process.exit(1);
  });
