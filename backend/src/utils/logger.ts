type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel = ((process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')).toLowerCase() as LogLevel);

const canLog = (level: LogLevel): boolean => {
  return levelPriority[level] >= (levelPriority[configuredLevel] ?? levelPriority.info);
};

const normalizeMeta = (meta?: Record<string, unknown>) => {
  if (!meta) return undefined;

  const normalized: Record<string, unknown> = {};
  Object.entries(meta).forEach(([key, value]) => {
    if (value instanceof Error) {
      normalized[key] = {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
      return;
    }

    normalized[key] = value;
  });

  return normalized;
};

const writeLog = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
  if (!canLog(level)) return;

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(normalizeMeta(meta) || {}),
  };

  const serialized = JSON.stringify(payload);

  if (level === 'error') {
    console.error(serialized);
    return;
  }

  if (level === 'warn') {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
};

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => writeLog('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => writeLog('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => writeLog('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => writeLog('error', message, meta),
};
