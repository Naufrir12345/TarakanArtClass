import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { ReminderService } from './reminder.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wa-queue')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly reminderService: ReminderService,
  ) {}

  /** GET /wa-queue — Ambil semua antrian pesan */
  @Get()
  async getQueue() {
    return this.whatsappService.getAllQueue();
  }

  /** POST /wa-queue/send-test — Kirim pesan test ke nomor tertentu */
  @Post('send-test')
  async sendTestMessage(@Body() body: { phoneNumber: string; message: string }) {
    return this.whatsappService.sendMessage({
      phoneNumber: body.phoneNumber,
      message: body.message || '🧪 Ini adalah pesan test dari Manufindo Les System.',
    });
  }

  /** POST /wa-queue/trigger-reminders — Generate reminder kelas hari ini */
  @Post('trigger-reminders')
  async triggerReminders() {
    return this.whatsappService.triggerClassReminders();
  }

  /** POST /wa-queue/trigger-h1 — Generate reminder kelas H-1 (besok) */
  @Post('trigger-h1')
  async triggerH1Reminders() {
    return this.whatsappService.triggerH1Reminders();
  }

  /** POST /wa-queue/process — Proses & kirim semua pesan PENDING */
  @Post('process')
  async processQueue() {
    return this.whatsappService.processQueue();
  }

  /** POST /wa-queue/send-invoice-reminders — Kirim reminder semua tagihan belum bayar */
  @Post('send-invoice-reminders')
  async sendInvoiceReminders() {
    return this.reminderService.sendInvoiceReminders();
  }

  /** POST /wa-queue/send-invoice-reminder/:id — Kirim reminder untuk satu invoice */
  @Post('send-invoice-reminder/:id')
  async sendSingleInvoiceReminder(@Param('id') id: string) {
    return this.reminderService.sendSingleInvoiceReminder(id);
  }
}
