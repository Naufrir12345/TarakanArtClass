import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('activity-log')
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('targetTable') targetTable?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.activityLogService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      userId,
      action,
      targetTable,
      startDate,
      endDate,
    });
  }

  @Get('stats')
  getStats() {
    return this.activityLogService.getStats();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.activityLogService.findByUser(userId);
  }
}
