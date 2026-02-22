import { app } from './api/server.js';
import { logger } from './infrastructure/logger.js';

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  logger.info({ msg: 'server_listening', port, url: `http://localhost:${port}` });
});
