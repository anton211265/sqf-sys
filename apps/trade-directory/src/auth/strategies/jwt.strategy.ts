import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../interface/token.interface';
import { AuthService } from '../auth.service';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    { userId, orgId }: TokenPayload,
  ): Promise<IUserContext> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    if (!userId || !orgId) {
      throw new UnauthorizedException('Invalid token');
    }

    let userContext: IUserContext;

    try {
      userContext = await this.authService.userContext(userId, orgId, token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    return userContext;
  }
}
