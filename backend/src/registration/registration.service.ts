import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Injectable()
export class RegistrationService {
  constructor(private prisma: PrismaService) {}

  async register(dto: CreateRegistrationDto) {
    try {
      // Use transaction to ensure atomicity
      return await this.prisma.$transaction(async (tx) => {
        // 1. Create student
        const student = await tx.student.create({
          data: {
            namaAnak: dto.namaAnak,
            umur: dto.umur,
            namaOrtu: dto.namaOrtu,
            noHpOrtu: dto.noHpOrtu,
            emailOrtu: dto.emailOrtu,
            instagram: dto.instagram,
            alamat: dto.alamat,
          },
        });

        // 2. Create enrollments and schedules for each class
        const enrollments: any[] = [];
        const schedules: any[] = [];

        for (const schedule of dto.schedules) {
          // Verify class exists
          const cls = await tx.class.findUnique({
            where: { id: schedule.classId },
          });

          if (!cls) {
            throw new BadRequestException(`Kelas dengan ID ${schedule.classId} tidak ditemukan`);
          }

          // Check capacity
          const currentEnrollments = await tx.enrollment.count({
            where: {
              classId: schedule.classId,
              status: 'ACTIVE',
            },
          });

          if (currentEnrollments >= cls.maxCapacity) {
            throw new BadRequestException(`Kelas ${cls.namaKelas} sudah penuh (${cls.maxCapacity} siswa)`);
          }

          // Create enrollment
          const enrollment = await tx.enrollment.create({
            data: {
              studentId: student.id,
              classId: schedule.classId,
              status: 'ACTIVE',
            },
          });
          enrollments.push(enrollment);

          const now = new Date();
          const newSchedule = await tx.schedule.create({
            data: {
              studentId: student.id,
              classId: schedule.classId,
              dayOfWeek: schedule.dayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              activeMonth: now.getMonth() + 1,
              activeYear: now.getFullYear(),
              status: 'ACTIVE',
            },
          });
          schedules.push(newSchedule);
        }

        // 3. Create registration payment
        const totalAmount = await this.calculateRegistrationFee(tx, dto.schedules.map(s => s.classId));

        const payment = await tx.payment.create({
          data: {
            studentId: student.id,
            amount: totalAmount,
            paymentMethod: 'CASH',
            paymentType: 'REGISTRATION',
            status: 'PENDING',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        });

        return {
          student,
          enrollments,
          schedules,
          payment,
          message: 'Registrasi berhasil! Silakan lakukan pembayaran.',
        };
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Registration Transaction Error:', error);
      throw new BadRequestException(
        error.message || 'Gagal memproses pendaftaran. Periksa kembali kelengkapan data.',
      );
    }
  }

  async findAllRegistrations(query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          enrollments: { include: { class: true } },
          schedules: { include: { class: true } },
          payments: {
            where: { paymentType: 'REGISTRATION' },
          },
        },
      }),
      this.prisma.student.count(),
    ]);

    return {
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async calculateRegistrationFee(tx: any, classIds: string[]): Promise<number> {
    const classes = await tx.class.findMany({
      where: { id: { in: classIds } },
    });

    return classes.reduce((total: number, cls: any) => total + Number(cls.harga), 0);
  }
}
