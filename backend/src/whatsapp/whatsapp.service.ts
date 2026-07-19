import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios'; // Axios wrapper
import { ConfigService } from '@nestjs/config'; // env access
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  /**
   * Sends a plain‑text WhatsApp message using the configured third‑party API.
   */
  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    const apiUrl = this.configService.get<string>('WHATSAPP_API_URL');
    const apiKey = this.configService.get<string>('WHATSAPP_API_KEY');
    if (!apiUrl) {
      throw new InternalServerErrorException('WHATSAPP_API_URL not configured');
    }
    const payload = { to: phoneNumber, body: message };
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    try {
      await firstValueFrom(this.httpService.post(apiUrl, payload, { headers }));
    } catch (error) {
      const errMsg = (error as any)?.response?.data?.message || (error as any).message || 'Unknown error';
      throw new InternalServerErrorException(`WhatsApp send failed: ${errMsg}`);
    }
  }

  async getQueue() {
    return this.prisma.whatsAppQueue.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Cron Job berjalan setiap hari jam 07:00 Pagi untuk men-generate reminder H-1 (besok)
  @Cron('0 7 * * *')
  async handleCronH1Reminders() {
    console.log('Menjalankan otomatis Cron Job Pengingat H-1...');
    await this.triggerH1Reminders();
  }

  async triggerClassReminders() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Dapatkan jadwal aktif untuk hari ini
    const schedules = await this.prisma.schedule.findMany({
      where: {
        dayOfWeek: dayOfWeek,
        status: 'ACTIVE',
      },
      include: {
        student: true,
        class: true,
      },
    });

    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    let createdCount = 0;

    for (const schedule of schedules) {
      const student = schedule.student;
      const cls = schedule.class;

      // Cek apakah pengingat sudah dibuat hari ini untuk menghindari duplikat
      const existingQueue = await this.prisma.whatsAppQueue.findFirst({
        where: {
          studentId: student.id,
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      });

      if (!existingQueue) {
        const message = `Halo Ayah/Bunda dari ${student.namaAnak}. Mengingatkan kembali bahwa hari ini ada jadwal les kelas *${cls.namaKelas}* pada pukul *${schedule.startTime} - ${schedule.endTime}*. Mohon hadir tepat waktu ya. Terima kasih!`;
        
        await this.prisma.whatsAppQueue.create({
          data: {
            phoneNumber: student.noHpOrtu || '628123456789',
            message: message,
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

  async triggerH1Reminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayOfWeek = tomorrow.getDay(); // Hari esok

    // Dapatkan jadwal aktif untuk hari esok
    const schedules = await this.prisma.schedule.findMany({
      where: {
        dayOfWeek: dayOfWeek,
        status: 'ACTIVE',
      },
      include: {
        student: true,
        class: true,
      },
    });

    const startOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const endOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

    let createdCount = 0;

    for (const schedule of schedules) {
      const student = schedule.student;
      const cls = schedule.class;

      // Cek apakah pengingat H-1 sudah dibuat untuk hari esok
      const existingQueue = await this.prisma.whatsAppQueue.findFirst({
        where: {
          studentId: student.id,
          scheduledAt: {
            gte: startOfTomorrow,
            lte: endOfTomorrow,
          },
        },
      });

      if (!existingQueue) {
        const message = `Halo Ayah/Bunda dari ${student.namaAnak}. Mengingatkan kembali bahwa BESOK anak Anda memiliki jadwal les kelas *${cls.namaKelas}* pada pukul *${schedule.startTime} - ${schedule.endTime}*. Mohon bersiap-siap ya. Terima kasih!`;
        
        await this.prisma.whatsAppQueue.create({
          data: {
            phoneNumber: student.noHpOrtu || '628123456789',
            message: message,
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

  async processQueue() {
    const pendingQueues = await this.getQueue();

    let processedCount = 0;
    for (const queue of pendingQueues) {
      if (!queue.phoneNumber || queue.phoneNumber.trim() === '') {
        await this.prisma.whatsAppQueue.update({
          where: { id: queue.id },
          data: { status: 'FAILED', errorLog: 'Nomor telepon kosong.' },
        });
        continue;
      }
      try {
        await this.sendMessage(queue.phoneNumber, queue.message);
        await this.prisma.whatsAppQueue.update({
          where: { id: queue.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
        processedCount++;
      } catch (err) {
        await this.prisma.whatsAppQueue.update({
          where: { id: queue.id },
          data: { status: 'FAILED', errorLog: (err as any).message },
        });
      }
    }

    return { message: `Sukses memproses ${processedCount} pesan dalam antrean.` };
  }

  /**
   * Dipanggil otomatis saat ada siswa reschedule & slot kelas jadi kosong.
   * Kirim tawaran slot tersedia ke orang tua siswa lain dalam kelas yang sama
   * yang jadwalnya masih lama (> 3 hari dari sekarang), H-1 sebelum slot tersebut.
   */
  async broadcastVacantSlot(params: {
    classId: string;
    vacantDate: string; // ISO date string YYYY-MM-DD
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    rescheduledStudentName: string;
  }) {
    const { classId, vacantDate, dayOfWeek, startTime, endTime, rescheduledStudentName } = params;

    // Ambil semua siswa aktif di kelas ini (kecuali yang reschedule)
    const activeSchedules = await this.prisma.schedule.findMany({
      where: { classId, status: 'ACTIVE', dayOfWeek },
      include: { student: true, class: true },
    });

    if (activeSchedules.length === 0) return { notified: 0 };

    // Hitung tanggal H-1 sebelum slot kosong
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

      // Cek apakah siswa ini punya jadwal yang "masih lama" (> 3 hari ke depan dari hari ini)
      const today = new Date();
      const daysUntilNextClass = (dayOfWeek - today.getDay() + 7) % 7 || 7;
      if (daysUntilNextClass <= 3) continue; // Skip siswa yang kelasnya dalam 3 hari

      // Hindari duplikat broadcast
      const existingBroadcast = await this.prisma.whatsAppQueue.findFirst({
        where: {
          studentId: student.id,
          scheduledAt: { gte: new Date(notifyDate.toDateString()) },
          message: { contains: 'slot kosong' },
        },
      });
      if (existingBroadcast) continue;

      const message =
        `Halo Ayah/Bunda dari *${student.namaAnak}*. \n\n` +
        `Ada kabar baik! Karena *${rescheduledStudentName}* melakukan reschedule, ` +
        `kini tersedia *1 SLOT KOSONG* di kelas *${cls.namaKelas}* pada:\n` +
        `📅 ${slotDateLabel}\n` +
        `🕐 Pukul ${startTime} – ${endTime}\n\n` +
        `Jika Anda ingin memanfaatkan slot ini untuk kelas tambahan, ` +
        `silakan hubungi admin segera. Slot bersifat *first come first served*. \n\n` +
        `Terima kasih! 🎨`;

      await this.prisma.whatsAppQueue.create({
        data: {
          phoneNumber: student.noHpOrtu || '628123456789',
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
