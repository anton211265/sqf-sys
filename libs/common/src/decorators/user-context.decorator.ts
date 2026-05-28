import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthResponseDto } from '../guards/auth/dtos/auth-response.dto';

const getUserByContext = (context: ExecutionContext): AuthResponseDto => {
  return context.switchToHttp().getRequest().userContext;
};

export const UserContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => getUserByContext(context),
);
