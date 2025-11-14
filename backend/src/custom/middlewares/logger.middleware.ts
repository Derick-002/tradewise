import { Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { Logger } from '@nestjs/common';

export type TLogger = {
    duration: number;
    method: string;
    url: string;
    host: string;
    clientName: string;
    dataLength: number;
    statusCode: number
}

const logger = new Logger("   REST  ");

// Function-based logger middleware
export function loggerMiddleware() {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const logFilePath = path.join(logDir, 'request-log.txt');

  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    if (req.path.startsWith('/graphql')) {
      return next();
    }

    res.on('finish', () => {
        const duration = Date.now() - start;
        const method = req.method;
        const url = req.url;
        const host = req.host;
        const clientName = req.headers['user-agent'] || 'unknown client';
        const dataLength = req.socket.bytesRead;
        const statusCode = res.statusCode;

        // Decide log level & label based on status code
        const isError = statusCode >= 400;
        const statusLabel = isError ? chalk.red('ERROR') : chalk.green('OK');

        const consoleMessage =
            `${chalk.blue(method)} ${chalk.green(url)} ` +
            `${chalk.yellow('HTTP ' + statusCode.toString())} ${chalk.magenta(duration + 'ms')} ` +
            `${chalk.cyan(dataLength.toString())} bytes ${chalk.gray((req as any).user?.sub || '-')}` +
            ` | ${statusLabel}`;

        // Console logging with chalk (different level for errors)
        if (isError) {
            logger.error(consoleMessage);
        } else {
            logger.log(consoleMessage);
        }

        // File logging (keep full details, plain text)
        const fileStatusLabel = isError ? 'ERROR' : 'OK';
        const logMessage = `
[${new Date().toISOString()}] ${method} ${url} | Status: ${statusCode} (${fileStatusLabel}) | Host: ${host} | Client: ${clientName} | DataLength: ${dataLength} bytes | Duration: ${duration}ms | UserId: ${(req as any).user?.sub || ''}
        `;

        fs.appendFile(logFilePath, logMessage + '\n', (err) => {
            if (err) console.error('Error writing log file', err);
        });
    });

    return next();
  };
}