import pino from 'pino';

const logLevel = (process.env.LOG_LEVEL ?? 'info').toLowerCase();

/**
 * Redaction paths for future use (tokens, PII, etc.).
 * Add keys here to redact from all log output.
 */
const redactPaths = [
  'req.headers.authorization',
  'req.headers["x-api-key"]',
  '*.password',
  '*.token',
];

export const logger = pino({
  level: logLevel,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
});

export type Logger = pino.Logger;
