import {
  CHECK_POLICIES_KEY,
  PolicyHandler,
} from '@app/common/decorators/check-policies.decorator';
import { AuthResponseDto } from '@app/common/guards/auth/dtos/auth-response.dto';
import {
  AppAbility,
  CaslAbilityFactory,
} from '@app/common/modules/casl/casl-ability.factory';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authorization =
      context.switchToHttp().getRequest().headers?.authorization ||
      context.switchToHttp().getRequest().headers?.Authorization;

    if (!authorization) {
      return false;
    }

    const [bearer, token] = authorization.split(' ');
    if (bearer !== 'Bearer') {
      return false;
    }

    if (!token) {
      return false;
    }

    let response: AuthResponseDto;
    try {
      response = await this.authService.authenticate(token);
    } catch (error) {
      this.logger.error(error);
      return false;
    }
    if (!response) {
      this.logger.error('Response not found from auth service');
      return false;
    }

    if (!response.funderPersonaId) {
      this.logger.error('User is not a funder');
      return false;
    }

    context.switchToHttp().getRequest().userContext = response;
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) ?? [];

    const ability = this.caslAbilityFactory.createForUser(response);
    return policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    );
  }

  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
    if (typeof handler === 'function') {
      return handler(ability);
    }

    return handler.handle(ability);
  }
}
