import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        student: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });
    if (!payment) {
      throw new NotFoundException('Pembayaran tidak ditemukan');
    }
    return payment;
  }

  async create(dto: CreatePaymentDto) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Siswa tidak ditemukan');

    return this.prisma.payment.create({
      data: {
        studentId: dto.studentId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        paymentType: dto.paymentType,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        notes: dto.notes,
        status: 'PENDING',
      },
      include: {
        student: true,
      },
    });
  }

  async updateStatus(id: string, status: PaymentStatus) {
    const payment = await this.findOne(id);
    const oldStatus = payment.status;

    // If cancelled registration payment, delete the student (which cascades to enrollments, schedules, payments, etc.)
    if (status === 'CANCELLED' && payment.paymentType === 'REGISTRATION') {
      const studentName = payment.student?.namaAnak || 'Siswa';
      // Delete the student record
      await this.prisma.student.delete({
        where: { id: payment.studentId },
      });
      return {
        id,
        status: 'CANCELLED',
        message: `Pendaftaran siswa ${studentName} dibatalkan dan data siswa telah dihapus otomatis.`,
      };
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'PAID' ? new Date() : null,
      },
      include: {
        student: true,
      },
    });

    // Integrated with Finance Module: Create Income record when marked as PAID (and was not already PAID)
    if (status === 'PAID' && oldStatus !== 'PAID') {
      const categoryMap: Record<string, string> = {
        REGISTRATION: 'Pembayaran Registrasi',
        MONTHLY: 'Pembayaran SPP Bulanan',
        EXTRA_CLASS: 'Pembayaran Extra Class',
      };
      const category = categoryMap[payment.paymentType] || 'Pembayaran Les';
      const studentName = updatedPayment.student?.namaAnak || 'Siswa';

      await this.prisma.income.create({
        data: {
          amount: updatedPayment.amount,
          category,
          note: `Pembayaran ${category} - ${studentName}`,
          date: new Date(),
        },
      });
    }

    return updatedPayment;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.payment.delete({ where: { id } });
  }
}
