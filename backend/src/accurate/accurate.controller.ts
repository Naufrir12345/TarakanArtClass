import { Controller, Get, Post, Query, UseGuards, Res } from '@nestjs/common';
import { AccurateService } from './accurate.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Response } from 'express';

@Controller('accurate')
export class AccurateController {
  constructor(private readonly accurateService: AccurateService) {}

  @UseGuards(JwtAuthGuard)
  @Get('connect-url')
  getConnectUrl() {
    return { url: this.accurateService.getConnectUrl() };
  }

  // OAuth Authorization Callback (triggered by Accurate redirected page)
  @Get('callback')
  async callback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      return res.redirect('/admin/accurate?error=no_code_provided');
    }
    await this.accurateService.handleCallback(code);
    // Redirect admin user back to Accurate frontend dashboard setting
    return res.redirect('/admin/accurate?success=connected');
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  getConnectionStatus() {
    return this.accurateService.getConnectionStatus();
  }

  @UseGuards(JwtAuthGuard)
  @Post('sync/invoice')
  async syncInvoice(@Query('id') id: string) {
    return this.accurateService.syncInvoice(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sync/expense')
  async syncExpense(@Query('id') id: string) {
    return this.accurateService.syncExpense(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('logs')
  getSyncLogs() {
    return this.accurateService.getSyncLogs();
  }
}
