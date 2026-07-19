import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { WhatsappService } from './whatsapp.service';

/**
 * ReminderService — Service terpisah yang memanfaatkan WhatsappService
 * untuk mengirim reminder otomatis:
 *  - Reminder tagihan/invoice yang belum dibayar
 *  - Reminder tagihan mendekati jatuh tempo
 *  - Reminder tagihan yang sudah jatuh tempo (overdue)
 *
 * Contoh penggunaan dari controller/service lain:
 * ```ts
 * constructor(private reminderService: ReminderService) {}
 *
 * async someMethod() {
 *   // Kirim reminder tagihan ke semua orang tua
 *   await this.reminderService.sendInvoiceReminders();
 *
 *   // Kirim ke satu invoice spesifik
 *   await this.reminderService.sendSingleInvoiceReminder('invoice-id-123');
 * }
 * ```
 */
@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {}

  // ══════════════════════════════════════════════
  //  CRON: Auto-reminder tagihan setiap hari jam 09:00
  // ══════════════════════════════════════════════

  @Cron('0 9 * * *')
  async handleCronInvoiceReminders() {
    this.logger.log('⏰ Menjalankan Cron Job: Reminder Tagihan Otomatis...');
    const result = await this.sendInvoiceReminders();
    this.logger.log(`📋 Reminder tagihan: ${result.sent} terkirim, ${result.failed} gagal`);
  }

  // ══════════════════════════════════════════════
  //  Kirim Reminder Tagihan Belum Bayar
  // ══════════════════════════════════════════════

  /**
   * Cari semua invoice dengan status SENT/DRAFT/OVERDUE
   * yang sudah mendekati atau melewati jatuh tempo,
   * lalu kirim reminder WhatsApp ke orang tua.
   */
  async sendInvoiceReminders(): Promise<{ sent: number; failed: number; total: number }> {
    const unpaidInvoices = await this.prisma.invoice.findMany({
      where: {
        status: { in: ['SENT', 'DRAFT', 'OVERDUE'] },
      },
      include: {
        student: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    if (unpaidInvoices.length === 0) {
      this.logger.log('✅ Tidak ada tagihan yang perlu diingatkan.');
      return { sent: 0, failed: 0, total: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const invoice of unpaidInvoices) {
      const student = invoice.student;
      if (!student?.noHpOrtu) {
        this.logger.warn(`⚠️ Invoice ${invoice.invoiceNumber}: nomor HP orang tua kosong`);
        failed++;
        continue;
      }

      const dueDate = new Date(invoice.dueDate);
      const formattedDue = dueDate.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });

      const result = await this.whatsappService.sendInvoiceReminder({
        parentPhone: student.noHpOrtu,
        childName: student.namaAnak,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(invoice.totalAmount),
        dueDate: formattedDue,
        paymentUrl: invoice.snapUrl || undefined,
      });

      if (result.success) sent++;
      else failed++;

      // Jeda antar pesan
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    return { sent, failed, total: unpaidInvoices.length };
  }

  // ══════════════════════════════════════════════
  //  Kirim Reminder untuk Satu Invoice
  // ══════════════════════════════════════════════

  /**
   * Kirim reminder ke orang tua untuk satu invoice spesifik.
   * Berguna untuk tombol "Kirim Reminder" di halaman invoice.
   */
  async sendSingleInvoiceReminder(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { student: true },
    });

    if (!invoice) {
      return { success: false, error: 'Invoice tidak ditemukan' };
    }

    const student = invoice.student;
    if (!student?.noHpOrtu) {
      return { success: false, error: 'Nomor HP orang tua tidak tersedia' };
    }

    const dueDate = new Date(invoice.dueDate);
    const formattedDue = dueDate.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    return this.whatsappService.sendInvoiceReminder({
      parentPhone: student.noHpOrtu,
      childName: student.namaAnak,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: Number(invoice.totalAmount),
      dueDate: formattedDue,
      paymentUrl: invoice.snapUrl || undefined,
    });
  }
}
