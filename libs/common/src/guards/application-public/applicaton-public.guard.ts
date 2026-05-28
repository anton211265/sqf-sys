import {
  APPLICATION_PUBLIC_GRPC_SERVICE_NAME,
  ApplicationPublicGrpcServiceClient,
} from '@app/common/apps/risk-operation/proto/application-public';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ApplicationPublicGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(ApplicationPublicGuard.name);
  private applicationPublicService: ApplicationPublicGrpcServiceClient;

  constructor(
    @Inject(DependencyInjectionTokenEnum.RISK_OPERATION_GRPC_CLIENT)
    private readonly riskOperationGrpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.applicationPublicService =
      this.riskOperationGrpcClient.getService<ApplicationPublicGrpcServiceClient>(
        APPLICATION_PUBLIC_GRPC_SERVICE_NAME,
      );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const params = request.params;
    const applicationPublicUuid: string = params['applicationPublicUuid'];

    if (!applicationPublicUuid) {
      this.logger.warn('applicationPublicUuid not found in request params');
      return false;
    }

    try {
      const applicationPublicContext = await firstValueFrom(
        this.applicationPublicService.validateGrpc({
          applicationPublicUuid,
        }),
      );
      context.switchToHttp().getRequest().applicationPublicContext =
        applicationPublicContext;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
    return true;
  }
}
