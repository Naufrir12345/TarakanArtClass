import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getAnalyticsData() {
    // 1. Get total tuition fee income
    const payments = await this.prisma.tuitionFee.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    });

    // 2. Get total expenses
    const expenses = await this.prisma.expense.aggregate({
      _sum: { amount: true },
    });

    // 3. Class trends (group enrollments by status)
    const enrollmentStats = await this.prisma.enrollment.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // 4. Attendance summary
    const attendanceStats = await this.prisma.attendance.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    return {
      totalPendapatan: payments._sum.amount ? Number(payments._sum.amount) : 0,
      totalPengeluaran: expenses._sum.amount ? Number(expenses._sum.amount) : 0,
      kpiAchievement: 92,
      classTrends: enrollmentStats.map(item => ({ month: item.status, total: item._count.id })),
      staffPerformance: attendanceStats.map(item => ({ name: item.status, score: item._count.id }))
    };
  }
}