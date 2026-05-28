import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ApplicationPublicService } from './application-public.service';

@Injectable()
export class ApplicationPublicGuard implements CanActivate {
  private readonly logger = new Logger(ApplicationPublicGuard.name);

  constructor(
    private readonly applicationPublicService: ApplicationPublicService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const params = request.params;
    const applicationPublicUuid: string = params['applicationPublicUuid'];

    if (!applicationPublicUuid) {
      this.logger.warn('applicationPublicUuid not found in request params');
      return false;
    }

    try {
      const applicationPublicContext =
        await this.applicationPublicService.validate(applicationPublicUuid);
      context.switchToHttp().getRequest().applicationPublicContext =
        applicationPublicContext;
    } catch (error) {
      return false;
    }
    return true;
  }
}
