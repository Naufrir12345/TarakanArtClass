import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PrismaService } from './prisma/prisma.service';

@Controller('analytics')
// @UseGuards(JwtAuthGuard)
export class AppController {
  constructor(private prisma: PrismaService) { }

  @Get()
  async getAnalytics() {
    // 1. Revenue: aggregate from Income and Expense tables (same as finance module)
    const [incomeAgg, expenseAgg, incomes, expenses] = await Promise.all([
      this.prisma.income.aggregate({ _sum: { amount: true } }),
      this.prisma.expense.aggregate({ _sum: { amount: true } }),
      this.prisma.income.findMany({ orderBy: { date: 'asc' } }),
      this.prisma.expense.findMany({ orderBy: { date: 'asc' } }),
    ]);

    const totalIncome = Number(incomeAgg._sum.amount ?? 0);
    const totalExpense = Number(expenseAgg._sum.amount ?? 0);

    // 2. Monthly Trend (income vs expense per month)
    const monthlyMap: Record<string, { income: number; expense: number }> = {};

    incomes.forEach((item) => {
      const key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expense: 0 };
      monthlyMap[key].income += Number(item.amount);
    });

    expenses.forEach((item) => {
      const key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expense: 0 };
      monthlyMap[key].expense += Number(item.amount);
    });

    const monthlyTrend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, vals]) => ({
        period,
        income: vals.income,
        expense: vals.expense,
        profit: vals.income - vals.expense,
      }));

    // 3. Students summary
    const [totalStudents, enrollments] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.enrollment.findMany(),
    ]);

    const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVE').length;
    const inactiveEnrollments = enrollments.filter((e) => e.status === 'INACTIVE').length;

    // 4. Class popularity
    const classes = await this.prisma.class.findMany({
      include: {
        enrollments: { where: { status: 'ACTIVE' } },
      },
    });

    const classStats = classes
      .map((c) => ({
        namaKelas: c.namaKelas,
        tipe: c.tipe,
        enrolled: c.enrollments.length,
        maxCapacity: c.maxCapacity,
        occupancy: c.maxCapacity > 0 ? Math.round((c.enrollments.length / c.maxCapacity) * 100) : 0,
      }))
      .sort((a, b) => b.enrolled - a.enrolled);

    // 5. Payment methods breakdown
    const payments = await this.prisma.payment.findMany({ where: { status: 'PAID' } });
    const paymentMethods: Record<string, number> = {};
    payments.forEach((p) => {
      paymentMethods[p.paymentMethod] = (paymentMethods[p.paymentMethod] || 0) + Number(p.amount);
    });

    // 6. Attendance summary
    const attendanceStats = await this.prisma.attendance.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const totalAttendance = attendanceStats.reduce((sum, s) => sum + s._count.id, 0);
    const presentCount = attendanceStats.find((s) => s.status === 'PRESENT')?._count.id || 0;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    // 7. KPI Achievement: based on collection rate
    const kpiAchievement = totalIncome > 0
      ? Math.round((totalIncome / (totalIncome + totalExpense)) * 100)
      : 0;

    return {
      totalPendapatan: totalIncome,
      totalPengeluaran: totalExpense,
      kpiAchievement,
      attendanceRate,
      totalStudents,
      activeEnrollments,
      inactiveEnrollments,
      monthlyTrend,
      classStats,
      paymentMethods,
      staffPerformance: attendanceStats.map((s) => ({
        name: s.status,
        score: s._count.id,
      })),
    };
  }
}