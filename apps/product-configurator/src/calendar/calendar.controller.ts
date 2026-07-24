import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  RemotePermissionGuard,
  RequirePermission,
} from '../rbac/remote-permission.guard';
import { CalendarSettingsDto, UpsertCalendarDayDto } from '../dtos';
import { CalendarService } from './calendar.service';

@Controller('api/calendar')
@UseGuards(RemotePermissionGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @RequirePermission('config_calendar_view')
  overview(@Req() req) {
    return this.calendarService.overview(req.userContext);
  }

  @Post('days')
  @RequirePermission('config_calendar_manage')
  upsertDay(@Req() req, @Body() dto: UpsertCalendarDayDto) {
    return this.calendarService.upsertDay(req.userContext, dto);
  }

  @Delete('days/:id')
  @RequirePermission('config_calendar_manage')
  deleteDay(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.calendarService.deleteDay(req.userContext, id);
  }

  @Patch('settings')
  @RequirePermission('config_calendar_manage')
  patchSettings(@Req() req, @Body() dto: CalendarSettingsDto) {
    return this.calendarService.patchSettings(req.userContext, dto);
  }
}
