import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { CreateReplacementDto } from './dto/create-replacement.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class SchedulesService {
  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {}

  async findAll(month?: number, year?: number) {
    const whereClause: any = {};
    if (month && year) {
      whereClause.OR = [
        { activeMonth: Number(month), activeYear: Number(year) },
        { activeMonth: null, activeYear: null },
      ];
    }
    return this.prisma.schedule.findMany({
      where: whereClause,
      include: {
        student: true,
        class: true,
        replacements: true,
      },
    });
  }

  async copyMonth(sourceMonth: number, sourceYear: number, targetMonth: number, targetYear: number) {
    const sourceSchedules = await this.prisma.schedule.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { activeMonth: Number(sourceMonth), activeYear: Number(sourceYear) },
          { activeMonth: null, activeYear: null },
        ],
      },
    });

    let copiedCount = 0;
    for (const s of sourceSchedules) {
      const existing = await this.prisma.schedule.findFirst({
        where: {
          studentId: s.studentId,
          classId: s.classId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          activeMonth: Number(targetMonth),
          activeYear: Number(targetYear),
        },
      });

      if (!existing) {
        await this.prisma.schedule.create({
          data: {
            studentId: s.studentId,
            classId: s.classId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            activeMonth: Number(targetMonth),
            activeYear: Number(targetYear),
            status: 'ACTIVE',
          },
        });
        copiedCount++;
      }
    }

    return {
      message: `Berhasil menyalin ${copiedCount} jadwal ke bulan ${targetMonth}/${targetYear}`,
      count: copiedCount,
    };
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        student: true,
        class: true,
        replacements: true,
      },
    });
    if (!schedule) {
      throw new NotFoundException('Jadwal tidak ditemukan');
    }
    return schedule;
  }

  async create(dto: CreateScheduleDto) {
    // Check if student and class exist
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Siswa tidak ditemukan');

    const cls = await this.prisma.class.findUnique({ where: { id: dto.classId } });
    if (!cls) throw new NotFoundException('Kelas tidak ditemukan');

    return this.prisma.schedule.create({
      data: dto,
    });
  }

  async update(id: string, dto: Partial<CreateScheduleDto>) {
    await this.findOne(id);
    return this.prisma.schedule.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.schedule.delete({ where: { id } });
  }

  // --- REPLACEMENT SYSTEM ---
  async createReplacement(dto: CreateReplacementDto) {
    const schedule = await this.findOne(dto.scheduleId);

    // Create the replacement request
    const replacement = await this.prisma.replacement.create({
      data: {
        scheduleId: dto.scheduleId,
        originalDate: new Date(dto.originalDate),
        replacementDate: dto.replacementDate ? new Date(dto.replacementDate) : null,
        newDayOfWeek: dto.newDayOfWeek,
        newStartTime: dto.newStartTime,
        newEndTime: dto.newEndTime,
        reason: dto.reason,
        status: 'PENDING',
      },
    });

    // Auto replacement logic: find other classes with the same class type that have space
    // and try to recommend if they fits
    if (!dto.replacementDate) {
      const recommendations = await this.findRecommendations(dto.scheduleId);
      if (recommendations.length > 0) {
        // Recommend the first matching recommendation
        const rec = recommendations[0];
        await this.prisma.replacement.update({
          where: { id: replacement.id },
          data: {
            replacementDate: rec.date,
            newDayOfWeek: rec.dayOfWeek,
            newStartTime: rec.startTime,
            newEndTime: rec.endTime,
          },
        });
      }
    }

    return this.prisma.replacement.findUnique({
      where: { id: replacement.id },
      include: {
        schedule: {
          include: {
            student: true,
            class: true,
          },
        },
      },
    });
  }

  async findRecommendations(scheduleId: string) {
    const schedule = await this.findOne(scheduleId);
    const classType = schedule.class.tipe;

    // Find other schedules/slots for this class type that have capacity
    const otherSchedules = await this.prisma.schedule.findMany({
      where: {
        class: {
          tipe: classType,
        },
        NOT: {
          studentId: schedule.studentId, // don't recommend student's own slot
        },
        status: 'ACTIVE',
      },
      include: {
        class: true,
      },
    });

    // We can propose dates for the next 14 days matching those days of week
    const recommendations: any[] = [];
    const today = new Date();

    for (let i = 1; i <= 14; i++) {
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + i);
      const dayOfWeek = futureDate.getDay();

      // Find if there is an active class slot on this day of week
      const matchingSlots = otherSchedules.filter(s => s.dayOfWeek === dayOfWeek);
      const seenSlots = new Set<string>();

      for (const slot of matchingSlots) {
        const slotKey = `${slot.classId}-${dayOfWeek}-${slot.startTime}`;
        if (seenSlots.has(slotKey)) continue;
        seenSlots.add(slotKey);

        // Check current occupancy on that specific date/time (schedules + extra classes - cancellations)
        const activeCount = await this.prisma.schedule.count({
          where: {
            classId: slot.classId,
            dayOfWeek: dayOfWeek,
            startTime: slot.startTime,
            status: 'ACTIVE',
          },
        });

        if (activeCount < slot.class.maxCapacity) {
          const date = new Date(futureDate);
          const [hours, minutes] = slot.startTime.split(':').map(Number);
          date.setHours(hours, minutes, 0, 0);

          recommendations.push({
            date,
            dayOfWeek: dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            className: slot.class.namaKelas,
            availableSlots: slot.class.maxCapacity - activeCount,
          });
        }
      }
    }

    return recommendations;
  }

  async findAllReplacements() {
    return this.prisma.replacement.findMany({
      include: {
        schedule: {
          include: {
            student: true,
            class: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondToReplacement(id: string, response: 'ACCEPTED' | 'REJECTED') {
    const replacement = await this.prisma.replacement.findUnique({
      where: { id },
      include: {
        schedule: {
          include: {
            student: true,
            class: true,
          },
        },
      },
    });

    if (!replacement) {
      throw new NotFoundException('Replacement request tidak ditemukan');
    }

    const updated = await this.prisma.replacement.update({
      where: { id },
      data: {
        status: response === 'ACCEPTED' ? 'ACCEPTED' : 'REJECTED',
        parentResponse: response,
      },
    });

    // If accepted, update the actual schedule or create a temporary reschedule record
    if (response === 'ACCEPTED' && replacement.newDayOfWeek !== null && replacement.newStartTime && replacement.newEndTime) {
      const originalDayOfWeek = replacement.schedule.dayOfWeek;
      const originalStartTime = replacement.schedule.startTime;
      const originalEndTime = replacement.schedule.endTime;

      // In a real-world scenario, we could swap or permanently modify schedule, or just mark this replacement as accepted.
      // We do not permanently update the weekly schedule here to preserve the original class day.
      // The replacement date is handled dynamically in the calendar/attendance views.

      // Automatically broadcast vacant slot message
      try {
        await this.whatsappService.broadcastVacantSlot({
          classId: replacement.schedule.classId,
          vacantDate: replacement.originalDate.toISOString().split('T')[0],
          dayOfWeek: originalDayOfWeek,
          startTime: originalStartTime,
          endTime: originalEndTime,
          rescheduledStudentName: replacement.schedule.student.namaAnak,
        });
      } catch (err) {
        console.error('Gagal memancarkan slot kosong via WhatsApp:', err);
      }
    }

    return updated;
  }
}
