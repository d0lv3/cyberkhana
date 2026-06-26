import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!);
    logger.info('database.connected', {
      host: conn.connection.host,
      port: conn.connection.port,
      dbName: conn.connection.name,
    });
  } catch (error) {
    logger.error('database.connection_failed', { error });
    process.exit(1);
  }
};
