import { ForbiddenError } from '@casl/ability';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AppAbility } from '../modules/casl/casl-ability.factory';

@Catch(ForbiddenError)
export class CaslForbiddenErrorFilter implements ExceptionFilter {
  catch(exception: ForbiddenError<AppAbility>, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = HttpStatus.FORBIDDEN;

    response.status(status).json({
      message: exception.message,
      error: 'Forbidden',
      statusCode: status,
    });
  }
}
