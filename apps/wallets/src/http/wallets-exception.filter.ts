import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { WalletsError } from '../errors.js';

@Catch()
export class WalletsExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    if (exception instanceof WalletsError) {
      response.status(exception.status).json({
        ok: false,
        error: {
          code: exception.code,
          message: exception.message,
        },
      });
      return;
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json({
        ok: false,
        error: {
          code: 'http_error',
          message:
            typeof body === 'string'
              ? body
              : (body as { message?: string }).message ?? 'Request failed',
        },
      });
      return;
    }
    console.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      ok: false,
      error: {
        code: 'internal_error',
        message: 'Internal server error',
      },
    });
  }
}
