import winston from 'winston';
import { format } from 'winston';

/**
 * Log levels:
 * error: 0 - Critical errors that need immediate attention
 * warn: 1 - Warning messages that might require intervention
 * info: 2 - General information about application flow
 * http: 3 - HTTP request/response logs
 * verbose: 4 - More detailed information
 * debug: 5 - Debugging information with high detail level
 * silly: 6 - The most granular information
 */

// Custom log format with colors and timestamp
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.colorize(),
  format.printf(({ timestamp, level, message, service = 'blokbustr', ...rest }) => {
    const restString = Object.keys(rest).length ? `\n${JSON.stringify(rest, null, 2)}` : '';
    return `${timestamp} [${service}] ${level}: ${message}${restString}`;
  })
);

// Default console transport
const consoleTransport = new winston.transports.Console({
  level: process.env.LOG_LEVEL || 'info',
});

// Create the logger instance
const logger = winston.createLogger({
  format: customFormat,
  defaultMeta: { service: 'blokbustr' },
  transports: [consoleTransport],
  // Don't exit on error
  exitOnError: false,
});

// Helper method to create child loggers for different components
export const createChildLogger = (component: string) => {
  return logger.child({ service: `blokbustr:${component}` });
};

// Create default loggers for common components
export const bitcoinLogger = createChildLogger('bitcoin');
export const evmLogger = createChildLogger('evm');
export const solanaLogger = createChildLogger('solana');
export const historyLogger = createChildLogger('history');
export const subscriptionLogger = createChildLogger('subscription');

// Add a simple file transport if LOG_TO_FILE is set
if (process.env.LOG_TO_FILE === 'true') {
  logger.add(
    new winston.transports.File({
      filename: process.env.LOG_FILE_PATH || 'logs/blokbustr.log',
      level: process.env.LOG_FILE_LEVEL || 'info',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
      ),
    })
  );
  
  logger.info('File logging enabled');
}

// Export the logger as default
export default logger;
