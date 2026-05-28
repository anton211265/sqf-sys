import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApplicationPublicGuardResponseDto } from '../guards/application-public/dtos/application-public-guard-response.dto';

const getApplicationPublicGuardByContext = (
  context: ExecutionContext,
): ApplicationPublicGuardResponseDto => {
  return context.switchToHttp().getRequest().applicationPublicContext;
};

export const ApplicationPublicContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getApplicationPublicGuardByContext(context),
);
