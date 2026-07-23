import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  getSummary(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDashboardSummary(query);
  }

  @Get('revenue')
  getRevenue(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getRevenue(query);
  }

  @Get('students')
  getStudents() {
    return this.analyticsService.getStudents();
  }

  @Get('classes')
  getClasses() {
    return this.analyticsService.getClasses();
  }

  @Get('payments')
  getPayments() {
    return this.analyticsService.getPayments();
  }

  @Get('forecast')
  getForecast() {
    return this.analyticsService.getForecast();
  }
}
