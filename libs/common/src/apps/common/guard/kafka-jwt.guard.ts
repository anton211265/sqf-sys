import { TRADE_SERVICE } from '@app/common/constants/services';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { IUserContext } from '../interface/user-context.interface';
import { firstValueFrom } from 'rxjs';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';

@Injectable()
export class KafkaJwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TRADE_SERVICE) private readonly authClient: ClientKafka,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header = req.headers.authorization as string;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) throw new UnauthorizedException('No token');

    let userContext: IUserContext;

    try {
      userContext = await firstValueFrom(
        this.authClient.send(KafkaTopicEnum.AUTHENTICATE, { token }),
      );
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    req.user = userContext;

    return true;
  }
}
