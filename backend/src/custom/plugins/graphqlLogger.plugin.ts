import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { Logger } from '@nestjs/common';

const logger = new Logger(" GraphQL ");

export function graphqlLoggerPlugin(): ApolloServerPlugin<any> {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const logFilePath = path.join(logDir, 'graphql-log.txt');

  return {
    async requestDidStart(): Promise<GraphQLRequestListener<any>> {
      const start = Date.now();

      return {
        async didResolveOperation({ request, document, operationName, contextValue }) {
          if (!document) return;

          const opDef = document.definitions.find(d => d.kind === 'OperationDefinition');
          const opType = opDef?.kind === 'OperationDefinition' ? opDef.operation.toUpperCase() : 'UNKNOWN';
          if (opType === 'UNKNOWN') return;

          // Better introspection detection
          const isIntrospection =
            operationName === 'IntrospectionQuery' ||
            document.definitions.some(d => (d as any).name?.value === '__schema');
          if (isIntrospection) return;

          const userId = contextValue?.req?.user?.sub || '-';
          const client = contextValue?.req?.headers['user-agent'] || '-';
          const url = contextValue?.req?.url || '-';

          (contextValue as any)._graphqlLogger = {
            opType,
            operationName,
            userId,
            client,
            url,
            start,
          };
        },

async willSendResponse(requestContext) {
  const { contextValue, response } = requestContext;
  const info = (contextValue as any)._graphqlLogger;
  if (!info) return;

  const { opType, operationName, userId, client, url, start } = info;
  const duration = Date.now() - start;

  // Extract errors across Apollo Server 4 body shapes
  let errors: readonly any[] = [];
  const body = response.body as any;

  if (body?.kind === 'single') {
    errors = body.singleResult?.errors ?? [];
  } else if (body?.kind === 'incremental') {
    errors = [
      ...(body.initialResult?.errors ?? []),
      ...((body.subsequentResults ?? []).flatMap((r: any) => r.errors ?? [])),
    ];
  }

  let hasErrors = errors.length > 0;
  let status = 200;
  let errorMessage = '';

  if (hasErrors) {
    const err = errors[0];
    const ext = err?.extensions ?? {};
    status =
      ext.status ??
      ext.originalError?.statusCode ??
      ext.response?.statusCode ??
      500;

    errorMessage =
      ext.originalError?.message ??
      err.message ??
      'Unknown Error';

    // Set HTTP status for Apollo + Express
    requestContext.response.http = {
      ...(requestContext.response.http ?? { headers: new (require('@apollo/server').HeaderMap)() }),
      status,
    };
    if (contextValue?.res) {
      try {
        contextValue.res.statusCode = status;
      } catch {}
    }
  }

  const statusLabel = hasErrors ? 'ERROR' : 'SUCCESS';

  // Console summary — do NOT show error message
  if (hasErrors) {
    logger.error(
      `${chalk.blue(opType)} ${chalk.green(operationName || '-')} | ` +
      `User: ${chalk.cyan(userId)} | Duration: ${chalk.magenta(duration + 'ms')} | ${chalk.red('ERROR')} | ${chalk.red('HTTP ' + status)}`
    );
  } else {
    logger.log(
      `${chalk.blue(opType)} ${chalk.green(operationName || '-')} | ` +
      `User: ${chalk.cyan(userId)} | Duration: ${chalk.magenta(duration + 'ms')} | ${chalk.green('SUCCESS')}`
    );
  }

  // File log — full info including error message
  const logMessage = `[${new Date().toISOString()}] ${opType} ${operationName || '-'} | User: ${userId} | Client: ${client} | URL: ${url} | Duration: ${duration}ms | Status: ${statusLabel}${hasErrors ? ' | HTTP: ' + status + ' | Error: ' + errorMessage : ''}\n`;
  fs.appendFile(logFilePath, logMessage, err => {
    if (err) logger.error('Error writing GraphQL log file', err);
  });
}

      };
    },
  };
}
