import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { omit } from 'lodash';

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (!data) return data;

        if (Array.isArray(data)) {
          return data.map((item) => this.sanitize(item));
        }

        return this.sanitize(data);
      }),
    );
  }

  private sanitize(obj: any) {
    if (obj && typeof obj === 'object') {
      const sanitized = omit(obj, [
        'password',
        'resetPasswordToken',
        'resetPasswordExpires',
        'verifyAccountToken',
        'verifyAccountExpires',
        "isVerified",
      ]);
      
      for (const key in sanitized) {
        if (
          sanitized[key] &&
          typeof sanitized[key] === 'object' &&
          !Array.isArray(sanitized[key])
        ) {
          sanitized[key] = omit(sanitized[key], [
            'password',
            'resetPasswordToken',
            'resetPasswordExpires',
            'verifyAccountToken',
            'verifyAccountExpires',
            "isVerified",
          ]);
        }
      }

      return sanitized;
    }

    return obj;
  }
}
