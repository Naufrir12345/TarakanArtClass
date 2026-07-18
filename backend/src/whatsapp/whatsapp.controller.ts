import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wa-queue')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get()
  async getQueue() {
    return this.whatsappService.getQueue();
  }

  @Post('trigger-reminders')
  async triggerReminders() {
    return this.whatsappService.triggerClassReminders();
  }

  @Post('trigger-h1')
  async triggerH1Reminders() {
    return this.whatsappService.triggerH1Reminders();
  }

  @Post('process')
  async processQueue() {
    return this.whatsappService.processQueue();
  }
}
