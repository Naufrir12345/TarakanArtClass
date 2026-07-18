import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  getSummary() {
    return this.analyticsService.getDashboardSummary();
  }

  @Get('revenue')
  getRevenue() {
    return this.analyticsService.getRevenue();
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
