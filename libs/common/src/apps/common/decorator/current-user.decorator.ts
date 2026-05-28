import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IUserContext } from '../interface/user-context.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IUserContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
