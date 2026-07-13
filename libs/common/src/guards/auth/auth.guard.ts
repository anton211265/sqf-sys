import { OrganizationPersonRoleEnumProtoConverter } from '@app/common/apps/trade-directory/proto-converter';
import {
  AUTH_GRPC_SERVICE_NAME,
  AuthGrpcServiceClient,
} from '@app/common/apps/trade-directory/proto/auth';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import {
  CHECK_POLICIES_KEY,
  PolicyHandler,
} from '@app/common/decorators/check-policies.decorator';
import {
  AppAbility,
  CaslAbilityFactory,
} from '@app/common/modules/casl/casl-ability.factory';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthResponseDto } from './dtos/auth-response.dto';

@Injectable()
export class AuthGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(AuthGuard.name);
  private authService: AuthGrpcServiceClient;

  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    @Inject(DependencyInjectionTokenEnum.TRADE_DIRECTORY_GRPC_CLIENT)
    private readonly tradeDirectoryGrpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authService =
      this.tradeDirectoryGrpcClient.getService<AuthGrpcServiceClient>(
        AUTH_GRPC_SERVICE_NAME,
      );
  }

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
      const protoResponse = await firstValueFrom(
        this.authService.authenticateGrpc({ token }),
      );
      response = {
        ...protoResponse,
        organizationPersonRoles: protoResponse.organizationPersonRoles.map(
          (opr) => ({
            role: OrganizationPersonRoleEnumProtoConverter.convertToApp(
              opr.role,
            ),
          }),
        ),
      };
    } catch (error) {
      this.logger.error(error);
      return false;
    }
    if (!response) {
      this.logger.error('Response not found from auth service');
      return false;
    }

    if (!response.funderPersonaId) {
      this.logger.error('User is not a factor');
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
