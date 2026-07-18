import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HolidayClassService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.holidayClass.findMany({
      include: {
        enrollments: { include: { student: true } },
        _count: { select: { enrollments: true } },
        schedules: { orderBy: { date: 'asc' } },
      },
      orderBy: { tanggalMulai: 'desc' },
    });
  }

  async findOne(id: string) {
    const hc = await this.prisma.holidayClass.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: { student: true },
          orderBy: { createdAt: 'desc' },
        },
        schedules: { orderBy: { date: 'asc' } },
      },
    });
    if (!hc) throw new NotFoundException('Holiday Class tidak ditemukan');
    return hc;
  }

  async create(data: {
    namaProgram: string;
    deskripsi?: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    harga: number;
    maxCapacity?: number;
  }) {
    return this.prisma.holidayClass.create({
      data: {
        namaProgram: data.namaProgram,
        deskripsi: data.deskripsi,
        tanggalMulai: new Date(data.tanggalMulai),
        tanggalSelesai: new Date(data.tanggalSelesai),
        harga: data.harga,
        maxCapacity: data.maxCapacity || 15,
      },
      include: { _count: { select: { enrollments: true } }, schedules: true },
    });
  }

  async update(id: string, data: {
    namaProgram?: string;
    deskripsi?: string;
    tanggalMulai?: string;
    tanggalSelesai?: string;
    harga?: number;
    maxCapacity?: number;
    status?: string;
  }) {
    await this.findOne(id);
    return this.prisma.holidayClass.update({
      where: { id },
      data: {
        namaProgram: data.namaProgram,
        deskripsi: data.deskripsi,
        tanggalMulai: data.tanggalMulai ? new Date(data.tanggalMulai) : undefined,
        tanggalSelesai: data.tanggalSelesai ? new Date(data.tanggalSelesai) : undefined,
        harga: data.harga,
        maxCapacity: data.maxCapacity,
        status: data.status as any,
      },
      include: { _count: { select: { enrollments: true } }, schedules: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.holidayClass.delete({ where: { id } });
  }

  // Enrollment
  async enrollStudent(holidayClassId: string, studentId: string) {
    const hc = await this.findOne(holidayClassId);
    const enrolled = hc.enrollments.length;
    if (enrolled >= hc.maxCapacity) {
      throw new ConflictException('Kelas sudah penuh');
    }

    const existing = hc.enrollments.find((e) => e.studentId === studentId);
    if (existing) throw new ConflictException('Siswa sudah terdaftar di program ini');

    return this.prisma.holidayEnrollment.create({
      data: { holidayClassId, studentId },
      include: { student: true, holidayClass: true },
    });
  }

  async unenrollStudent(enrollmentId: string) {
    return this.prisma.holidayEnrollment.delete({ where: { id: enrollmentId } });
  }

  // Schedule management
  async addSchedule(holidayClassId: string, data: {
    date: string;
    startTime: string;
    endTime: string;
    topic?: string;
  }) {
    await this.findOne(holidayClassId);
    return this.prisma.holidaySchedule.create({
      data: {
        holidayClassId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        topic: data.topic,
      },
    });
  }

  async removeSchedule(scheduleId: string) {
    return this.prisma.holidaySchedule.delete({ where: { id: scheduleId } });
  }
}
