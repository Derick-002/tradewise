import { ArgumentsHost, Catch } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { ApolloError } from 'apollo-server-express';

@Catch(ApolloError)
export class ApolloErrorFilter implements GqlExceptionFilter {
  catch(exception: ApolloError, host: ArgumentsHost) {
    // just return to client, no console.log
    return exception; 
  }
}
