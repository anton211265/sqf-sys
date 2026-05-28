import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { AUTH_SERVICE, IAuthService } from '../auth.interface';
import { ErrorMessage } from '@app/common/apps/common/enum/error-messages.enum';

@Injectable()
export class APIKeyStrategy extends PassportStrategy(
  HeaderAPIKeyStrategy,
  'api-key',
) {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: IAuthService,
  ) {
    super({ header: 'api-key' }, true, async (apiKey: string, done: any) => {
      const apiKeyInfo = await this.authService.getApiKeyInfo(apiKey);

      if (apiKeyInfo && apiKeyInfo.isActive) {
        done(null, { orgId: apiKeyInfo.orgId });
      }
      done(new UnauthorizedException(ErrorMessage.INVALID_API_KEY), null);
    });
  }
}
