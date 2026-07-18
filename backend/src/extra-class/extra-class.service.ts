import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExtraClassDto } from './dto/create-extra-class.dto';
import { ExtraClassStatus } from '@prisma/client';

@Injectable()
export class ExtraClassService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.extraClass.findMany({
      include: {
        student: true,
        class: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const extraClass = await this.prisma.extraClass.findUnique({
      where: { id },
      include: {
        student: true,
        class: true,
      },
    });
    if (!extraClass) {
      throw new NotFoundException('Extra Class tidak ditemukan');
    }
    return extraClass;
  }

  async create(dto: CreateExtraClassDto) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Siswa tidak ditemukan');

    const cls = await this.prisma.class.findUnique({ where: { id: dto.classId } });
    if (!cls) throw new NotFoundException('Kelas tidak ditemukan');

    // Create extra class and associated payment in a transaction
    return this.prisma.$transaction(async (tx) => {
      const extraClass = await tx.extraClass.create({
        data: {
          studentId: dto.studentId,
          classId: dto.classId,
          date: new Date(dto.date),
          startTime: dto.startTime,
          endTime: dto.endTime,
          notes: dto.notes,
        },
      });

      // Automatically create a payment invoice for the extra class
      await tx.payment.create({
        data: {
          studentId: dto.studentId,
          amount: cls.harga,
          paymentMethod: 'CASH',
          paymentType: 'EXTRA_CLASS',
          status: 'PENDING',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          notes: `Biaya Extra Class: ${cls.namaKelas} pada ${dto.date}`,
        },
      });

      return extraClass;
    });
  }

  async updateStatus(id: string, status: ExtraClassStatus) {
    await this.findOne(id);
    return this.prisma.extraClass.update({
      where: { id },
      data: { status },
      include: {
        student: true,
        class: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.extraClass.delete({ where: { id } });
  }
}
