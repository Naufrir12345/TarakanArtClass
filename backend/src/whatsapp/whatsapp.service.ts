import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

// ──────────────────────────────────────────────
//  Interfaces — Untuk kemudahan reuse di service lain
// ──────────────────────────────────────────────

export interface SendMessageOptions {
  phoneNumber: string;
  message: string;
  /** Jumlah retry jika gagal (default: 2) */
  retries?: number;
}

export interface SendResult {
  success: boolean;
  phoneNumber: string;
  error?: string;
}

export interface BulkSendResult {
  total: number;
  sent: number;
  failed: number;
  details: SendResult[];
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  // ══════════════════════════════════════════════
  //  CORE: Kirim Pesan Teks (Single Message)
  // ══════════════════════════════════════════════

  /**
   * Kirim pesan teks WhatsApp ke satu nomor tujuan.
   *
   * Alur:
   *  1. Ambil WHATSAPP_API_URL & WHATSAPP_API_KEY dari environment
   *  2. Normalisasi nomor telepon ke format internasional (62xxx)
   *  3. POST ke API pihak ketiga via axios (HttpService)
   *  4. Retry otomatis jika gagal (configurable)
   *
   * Contoh penggunaan di service lain (misal ReminderService):
   * ```ts
   * await this.whatsappService.sendMessage({
   *   phoneNumber: '08123456789',
   *   message: 'Halo, ini pengingat jadwal les!',
   *   retries: 3,
   * });
   * ```
   */
  async sendMessage(options: SendMessageOptions): Promise<SendResult>;
  async sendMessage(phoneNumber: string, message: string): Promise<SendResult>;
  async sendMessage(
    optionsOrPhone: SendMessageOptions | string,
    messageArg?: string,
  ): Promise<SendResult> {
    // Overload: bisa dipanggil dengan object atau (phone, message)
    const opts: SendMessageOptions =
      typeof optionsOrPhone === 'string'
        ? { phoneNumber: optionsOrPhone, message: messageArg! }
        : optionsOrPhone;

    const { message, retries = 2 } = opts;
    const phoneNumber = this.normalizePhoneNumber(opts.phoneNumber);

    // Validasi
    if (!phoneNumber || phoneNumber.length < 10) {
      this.logger.warn(`Nomor telepon tidak valid: ${opts.phoneNumber}`);
      return { success: false, phoneNumber: opts.phoneNumber, error: 'Nomor telepon tidak valid' };
    }

    // Environment config
    const apiUrl = this.configService.get<string>('WHATSAPP_API_URL');
    const apiKey = this.configService.get<string>('WHATSAPP_API_KEY');

    if (!apiUrl) {
      this.logger.error('WHATSAPP_API_URL belum di-konfigurasi di environment variables');
      return {
        success: false,
        phoneNumber,
        error: 'WHATSAPP_API_URL not configured — set di Railway Variables atau .env',
      };
    }

    // Headers — mendukung Bearer token dan custom header
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Payload — format umum untuk API WhatsApp pihak ketiga
    // Sesuaikan dengan provider yang digunakan (Fonnte, Wablas, WA-Gateway, dll.)
    const payload = {
      target: phoneNumber,   // Fonnte format
      message: message,
      // Alternatif format untuk provider lain:
      // to: phoneNumber,    // Twilio / MessageBird
      // body: message,      // Twilio format
    };

    // Kirim dengan retry
    let lastError = '';
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        this.logger.log(
          `📤 Mengirim pesan ke ${phoneNumber} (attempt ${attempt}/${retries + 1})`,
        );

        const response = await firstValueFrom(
          this.httpService.post(apiUrl, payload, {
            headers,
            timeout: 15000, // 15 detik timeout
          }),
        );

        this.logger.log(
          `✅ Pesan berhasil dikirim ke ${phoneNumber} — status: ${response.status}`,
        );
        return { success: true, phoneNumber };
      } catch (error) {
        lastError =
          (error as any)?.response?.data?.message ||
          (error as any)?.response?.data?.detail ||
          (error as any).message ||
          'Unknown error';

        this.logger.warn(
          `⚠️ Gagal kirim ke ${phoneNumber} (attempt ${attempt}): ${lastError}`,
        );

        // Tunggu sebelum retry (exponential backoff)
        if (attempt <= retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.error(`❌ Gagal kirim pesan ke ${phoneNumber} setelah ${retries + 1} percobaan`);
    return { success: false, phoneNumber, error: lastError };
  }

  // ══════════════════════════════════════════════
  //  HELPER: Normalisasi Nomor Telepon
  // ══════════════════════════════════════════════

  /**
   * Normalisasi nomor telepon ke format internasional Indonesia (62xxx).
   * Contoh: 08123456789 → 628123456789
   */
  private normalizePhoneNumber(phone: string): string {
    if (!phone) return '';
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  }

  // ══════════════════════════════════════════════
  //  BULK SEND: Kirim ke banyak nomor sekaligus
  // ══════════════════════════════════════════════

  /**
   * Kirim pesan yang sama ke beberapa nomor sekaligus.
   * Mengembalikan ringkasan hasil pengiriman.
   *
   * Contoh penggunaan:
   * ```ts
   * const result = await this.whatsappService.sendBulk(
   *   ['08123456789', '08198765432'],
   *   'Pengumuman: Kelas libur hari ini.',
   * );
   * console.log(`Sent: ${result.sent}, Failed: ${result.failed}`);
   * ```
   */
  async sendBulk(phoneNumbers: string[], message: string): Promise<BulkSendResult> {
    const details: SendResult[] = [];
    let sent = 0;
    let failed = 0;

    for (const phone of phoneNumbers) {
      const result = await this.sendMessage({ phoneNumber: phone, message, retries: 1 });
      details.push(result);
      if (result.success) sent++;
      else failed++;

      // Jeda antar pesan agar tidak di-rate-limit oleh provider
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    return { total: phoneNumbers.length, sent, failed, details };
  }

  // ══════════════════════════════════════════════
  //  TEMPLATE: Kirim Reminder Kelas
  // ══════════════════════════════════════════════

  /**
   * Kirim reminder jadwal kelas ke orang tua.
   * Method ini bisa dipanggil dari ReminderService atau service lain.
   */
  async sendClassReminder(params: {
    parentPhone: string;
    childName: string;
    className: string;
    schedule: string;  // e.g. "Senin, 10:00 - 11:30"
  }): Promise<SendResult> {
    const message =
      `📚 *Pengingat Jadwal Les*\n\n` +
      `Halo Ayah/Bunda dari *${params.childName}*,\n\n` +
      `Mengingatkan bahwa anak Anda memiliki jadwal les:\n` +
      `📖 Kelas: *${params.className}*\n` +
      `🕐 Jadwal: *${params.schedule}*\n\n` +
      `Mohon hadir tepat waktu ya. Terima kasih! 🙏\n\n` +
      `_— Manufindo Les System_`;

    return this.sendMessage({ phoneNumber: params.parentPhone, message });
  }

  // ══════════════════════════════════════════════
  //  TEMPLATE: Kirim Reminder Tagihan/Invoice
  // ══════════════════════════════════════════════

  /**
   * Kirim reminder tagihan yang belum dibayar ke orang tua.
   * Method ini bisa dipanggil dari ReminderService.
   */
  async sendInvoiceReminder(params: {
    parentPhone: string;
    childName: string;
    invoiceNumber: string;
    totalAmount: number;
    dueDate: string;
    paymentUrl?: string;
  }): Promise<SendResult> {
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(params.totalAmount);

    let message =
      `💰 *Pengingat Tagihan*\n\n` +
      `Halo Ayah/Bunda dari *${params.childName}*,\n\n` +
      `Berikut tagihan yang belum diselesaikan:\n` +
      `📋 No. Invoice: *${params.invoiceNumber}*\n` +
      `💵 Jumlah: *${formattedAmount}*\n` +
      `📅 Jatuh Tempo: *${params.dueDate}*\n\n`;

    if (params.paymentUrl) {
      message += `🔗 Bayar sekarang: ${params.paymentUrl}\n\n`;
    }

    message +=
      `Mohon segera lakukan pembayaran. ` +
      `Jika sudah membayar, abaikan pesan ini.\n\n` +
      `Terima kasih! 🙏\n` +
      `_— Manufindo Les System_`;

    return this.sendMessage({ phoneNumber: params.parentPhone, message });
  }

  // ══════════════════════════════════════════════
  //  QUEUE MANAGEMENT
  // ══════════════════════════════════════════════

  /** Ambil semua pesan PENDING dari antrian */
  async getQueue() {
    return this.prisma.whatsAppQueue.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Ambil semua pesan (termasuk SENT, FAILED) */
  async getAllQueue() {
    return this.prisma.whatsAppQueue.findMany({
      orderBy: { createdAt: 'desc' },
      include: { student: true },
    });
  }

  // ══════════════════════════════════════════════
  //  CRON JOBS: Otomatis generate & kirim reminder
  // ══════════════════════════════════════════════

  /** Cron Job: Generate reminder H-1 setiap hari jam 07:00 Pagi */
  @Cron('0 7 * * *')
  async handleCronH1Reminders() {
    this.logger.log('⏰ Menjalankan Cron Job: Generate Pengingat H-1...');
    const result = await this.triggerH1Reminders();
    this.logger.log(`📋 ${result.message}`);
    // Langsung proses queue setelah generate
    const processResult = await this.processQueue();
    this.logger.log(`📤 ${processResult.message}`);
  }

  /** Cron Job: Proses antrian setiap 5 menit (kirim pesan PENDING) */
  @Cron('*/5 * * * *')
  async handleCronProcessQueue() {
    const pending = await this.prisma.whatsAppQueue.count({ where: { status: 'PENDING' } });
    if (pending === 0) return; // Skip jika tidak ada antrian
    this.logger.log(`⏰ Auto-process: ${pending} pesan PENDING ditemukan...`);
    await this.processQueue();
  }

  // ──────────────────────────────────────────────
  //  Generate Reminder Kelas Hari Ini
  // ──────────────────────────────────────────────

  async triggerClassReminders() {
    const today = new Date();
    const dayOfWeek = today.getDay();

    const schedules = await this.prisma.schedule.findMany({
      where: { dayOfWeek, status: 'ACTIVE' },
      include: { student: true, class: true },
    });

    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    let createdCount = 0;

    for (const schedule of schedules) {
      const student = schedule.student;
      const cls = schedule.class;

      const existingQueue = await this.prisma.whatsAppQueue.findFirst({
        where: {
          studentId: student.id,
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
      });

      if (!existingQueue) {
        const message =
          `📚 *Pengingat Jadwal Les*\n\n` +
          `Halo Ayah/Bunda dari *${student.namaAnak}*,\n` +
          `Hari ini ada jadwal les kelas *${cls.namaKelas}* ` +
          `pukul *${schedule.startTime} - ${schedule.endTime}*.\n\n` +
          `Mohon hadir tepat waktu ya. Terima kasih! 🙏\n` +
          `_— Manufindo Les System_`;

        await this.prisma.whatsAppQueue.create({
          data: {
            phoneNumber: student.noHpOrtu || '',
            message,
            status: 'PENDING',
            scheduledAt: today,
            studentId: student.id,
          },
        });
        createdCount++;
      }
    }

    return { message: `Sukses membuat ${createdCount} antrean reminder kelas baru untuk hari ini.` };
  }

  // ──────────────────────────────────────────────
  //  Generate Reminder Kelas H-1 (Besok)
  // ──────────────────────────────────────────────

  async triggerH1Reminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayOfWeek = tomorrow.getDay();

    const schedules = await this.prisma.schedule.findMany({
      where: { dayOfWeek, status: 'ACTIVE' },
      include: { student: true, class: true },
    });

    const startOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const endOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

    let createdCount = 0;

    for (const schedule of schedules) {
      const student = schedule.student;
      const cls = schedule.class;

      const existingQueue = await this.prisma.whatsAppQueue.findFirst({
        where: {
          studentId: student.id,
          scheduledAt: { gte: startOfTomorrow, lte: endOfTomorrow },
        },
      });

      if (!existingQueue) {
        const message =
          `📚 *Pengingat Jadwal Les Besok*\n\n` +
          `Halo Ayah/Bunda dari *${student.namaAnak}*,\n` +
          `*BESOK* anak Anda memiliki jadwal les kelas *${cls.namaKelas}* ` +
          `pukul *${schedule.startTime} - ${schedule.endTime}*.\n\n` +
          `Mohon bersiap-siap ya. Terima kasih! 🙏\n` +
          `_— Manufindo Les System_`;

        await this.prisma.whatsAppQueue.create({
          data: {
            phoneNumber: student.noHpOrtu || '',
            message,
            status: 'PENDING',
            scheduledAt: tomorrow,
            studentId: student.id,
          },
        });
        createdCount++;
      }
    }

    return { message: `Sukses membuat ${createdCount} antrean reminder kelas baru untuk besok (H-1).` };
  }

  // ══════════════════════════════════════════════
  //  PROCESS QUEUE: Kirim semua pesan PENDING
  // ══════════════════════════════════════════════

  async processQueue() {
    const pendingQueues = await this.getQueue();

    if (pendingQueues.length === 0) {
      return { message: 'Tidak ada pesan dalam antrian.', processed: 0, failed: 0 };
    }

    this.logger.log(`📤 Memproses ${pendingQueues.length} pesan dalam antrian...`);

    let processedCount = 0;
    let failedCount = 0;

    for (const queue of pendingQueues) {
      if (!queue.phoneNumber || queue.phoneNumber.trim() === '') {
        await this.prisma.whatsAppQueue.update({
          where: { id: queue.id },
          data: { status: 'FAILED', errorLog: 'Nomor telepon kosong.' },
        });
        failedCount++;
        continue;
      }

      const result = await this.sendMessage({
        phoneNumber: queue.phoneNumber,
        message: queue.message,
        retries: 2,
      });

      if (result.success) {
        await this.prisma.whatsAppQueue.update({
          where: { id: queue.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
        processedCount++;
      } else {
        await this.prisma.whatsAppQueue.update({
          where: { id: queue.id },
          data: { status: 'FAILED', errorLog: result.error || 'Unknown error' },
        });
        failedCount++;
      }

      // Jeda antar pesan
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return {
      message: `Sukses memproses ${processedCount} pesan, ${failedCount} gagal.`,
      processed: processedCount,
      failed: failedCount,
    };
  }

  // ══════════════════════════════════════════════
  //  BROADCAST: Slot Kosong (Reschedule)
  // ══════════════════════════════════════════════

  async broadcastVacantSlot(params: {
    classId: string;
    vacantDate: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    rescheduledStudentName: string;
  }) {
    const { classId, vacantDate, dayOfWeek, startTime, endTime, rescheduledStudentName } = params;

    const activeSchedules = await this.prisma.schedule.findMany({
      where: { classId, status: 'ACTIVE', dayOfWeek },
      include: { student: true, class: true },
    });

    if (activeSchedules.length === 0) return { notified: 0 };

    const slotDate = new Date(vacantDate);
    const notifyDate = new Date(slotDate);
    notifyDate.setDate(notifyDate.getDate() - 1);

    const slotDateLabel = slotDate.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    let notified = 0;
    for (const sched of activeSchedules) {
      const student = sched.student;
      const cls = sched.class;

      const today = new Date();
      const daysUntilNextClass = (dayOfWeek - today.getDay() + 7) % 7 || 7;
      if (daysUntilNextClass <= 3) continue;

      const existingBroadcast = await this.prisma.whatsAppQueue.findFirst({
        where: {
          studentId: student.id,
          scheduledAt: { gte: new Date(notifyDate.toDateString()) },
          message: { contains: 'slot kosong' },
        },
      });
      if (existingBroadcast) continue;

      const message =
        `🎨 *Slot Kosong Tersedia!*\n\n` +
        `Halo Ayah/Bunda dari *${student.namaAnak}*,\n\n` +
        `Karena *${rescheduledStudentName}* melakukan reschedule, ` +
        `tersedia *1 SLOT KOSONG* di kelas *${cls.namaKelas}*:\n` +
        `📅 ${slotDateLabel}\n` +
        `🕐 Pukul ${startTime} – ${endTime}\n\n` +
        `Hubungi admin segera jika berminat. ` +
        `Slot bersifat *first come first served*.\n\n` +
        `Terima kasih! 🎨\n` +
        `_— Manufindo Les System_`;

      await this.prisma.whatsAppQueue.create({
        data: {
          phoneNumber: student.noHpOrtu || '',
          message,
          status: 'PENDING',
          scheduledAt: notifyDate,
          studentId: student.id,
        },
      });
      notified++;
    }

    return { notified, message: `${notified} orang tua diberitahu tentang slot kosong.` };
  }
}
