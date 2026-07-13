import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import { UserContext } from '@app/common/decorators/user-context.decorator';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InitializeSystemDto } from './dto/initialize-system.dto';
import { SystemSetupGuard } from './system-setup.guard';
import { SystemSetupService } from './system-setup.service';

@ApiTags('system-setup')
@ApiBearerAuth('id-token')
@Controller('system-setup')
export class SystemSetupController {
  constructor(private readonly systemSetupService: SystemSetupService) {}

  @Post('initialize')
  @UseGuards(SystemSetupGuard)
  @ApiOperation({
    summary: 'Initialize the platform — creates the Funder Organization and Super Admin account.',
    description: 'Restricted to users with the SQFSYS role. Can only be called once per Super Admin email.',
  })
  async initialize(
    @Body() dto: InitializeSystemDto,
    @UserContext() userContext: IUserContext,
  ) {
    return this.systemSetupService.initialize(dto, userContext.id);
  }
}
