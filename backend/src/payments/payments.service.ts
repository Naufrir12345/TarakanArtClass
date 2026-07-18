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

    if (status === 'CANCELLED' && payment.paymentType === 'REGISTRATION') {
      await this.prisma.$transaction([
        this.prisma.enrollment.updateMany({
          where: { studentId: payment.studentId },
          data: { status: 'INACTIVE' },
        }),
        this.prisma.schedule.updateMany({
          where: { studentId: payment.studentId },
          data: { status: 'CANCELLED' },
        }),
      ]);
    }

    return updatedPayment;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.payment.delete({ where: { id } });
  }
}
