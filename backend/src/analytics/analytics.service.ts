import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getRevenue(query?: AnalyticsQueryDto) {
    let start: Date;
    let end: Date;

    const now = new Date();

    if (query?.startDate && query?.endDate) {
      start = new Date(query.startDate);
      end = new Date(query.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Format tanggal tidak valid (YYYY-MM-DD)');
      }

      if (start > end) {
        throw new BadRequestException('Tanggal mulai tidak boleh lebih besar dari tanggal selesai');
      }

      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 32) {
        throw new BadRequestException('Rentang tanggal maksimal adalah 1 bulan kalender (31 hari)');
      }
    } else {
      // Default: current month (1st of month to today/end of month)
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Fetch incomes and expenses within range
    const [incomes, expenses] = await Promise.all([
      this.prisma.income.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
      }),
      this.prisma.expense.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
      }),
    ]);

    // Build map for each day in range
    const dailyData: { [dateStr: string]: { dateStr: string; displayLabel: string; income: number; expense: number; profit: number } } = {};

    const curr = new Date(start);
    while (curr <= end) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, '0');
      const day = String(curr.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const displayLabel = `${day} ${monthsIndo[curr.getMonth()]}`;

      dailyData[key] = {
        dateStr: key,
        displayLabel,
        income: 0,
        expense: 0,
        profit: 0,
      };

      curr.setDate(curr.getDate() + 1);
    }

    incomes.forEach((inc) => {
      const incDate = new Date(inc.date);
      const year = incDate.getFullYear();
      const month = String(incDate.getMonth() + 1).padStart(2, '0');
      const day = String(incDate.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      if (dailyData[key]) {
        dailyData[key].income += Number(inc.amount);
      }
    });

    expenses.forEach((exp) => {
      const expDate = new Date(exp.date);
      const year = expDate.getFullYear();
      const month = String(expDate.getMonth() + 1).padStart(2, '0');
      const day = String(expDate.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      if (dailyData[key]) {
        dailyData[key].expense += Number(exp.amount);
      }
    });

    const dailyTrend = Object.values(dailyData).map((d) => ({
      period: d.displayLabel,
      date: d.dateStr,
      income: d.income,
      expense: d.expense,
      profit: d.income - d.expense,
    }));

    dailyTrend.sort((a, b) => a.date.localeCompare(b.date));

    const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      monthlyTrend: dailyTrend,
      summary: {
        totalIncome,
        totalExpense,
        profit: totalIncome - totalExpense,
      },
      range: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
    };
  }

  async getStudents() {
    const [students, enrollments, registrationPayments] = await Promise.all([
      this.prisma.student.findMany(),
      this.prisma.enrollment.findMany({ include: { student: true } }),
      this.prisma.payment.findMany({
        where: { paymentType: 'REGISTRATION' },
      }),
    ]);

    // Student Growth by Month
    const growth: { [key: string]: number } = {};
    students.forEach((s) => {
      const monthYear = this.getMonthYearKey(new Date(s.createdAt));
      growth[monthYear] = (growth[monthYear] || 0) + 1;
    });

    const growthTrend = Object.keys(growth)
      .map((key) => ({ period: key, count: growth[key] }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Active vs Inactive vs Cancelled
    const totalStudents = students.length;
    const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVE');
    const uniqueActiveStudents = new Set(activeEnrollments.map((e) => e.studentId));

    const cancelledStudentIds = new Set(
      registrationPayments
        .filter((p) => p.status === 'CANCELLED')
        .map((p) => p.studentId)
    );
    // Remove active ones from cancelled set (just in case they registered again later)
    uniqueActiveStudents.forEach((id) => cancelledStudentIds.delete(id));

    const totalCancelledStudents = cancelledStudentIds.size;
    const totalActiveStudents = uniqueActiveStudents.size;
    const inactiveStudents = Math.max(0, totalStudents - totalActiveStudents - totalCancelledStudents);

    const activeRate = totalStudents > 0 ? (totalActiveStudents / totalStudents) * 100 : 0;
    const churnRate = totalStudents > 0 ? (inactiveStudents / totalStudents) * 100 : 0;

    const cancelledStudentsList = students.filter((s) => cancelledStudentIds.has(s.id));

    return {
      growthTrend,
      summary: {
        totalStudents,
        activeStudents: totalActiveStudents,
        inactiveStudents,
        cancelledStudents: totalCancelledStudents,
        activeRate: Math.round(activeRate * 10) / 10,
        churnRate: Math.round(churnRate * 10) / 10,
      },
      cancelledStudentsList,
    };
  }

  async getClasses() {
    const classes = await this.prisma.class.findMany({
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    const classStats = classes.map((c) => {
      const currentEnrolled = c.enrollments.length;
      const capacity = c.maxCapacity || 10;
      const occupancyRate = capacity > 0 ? (currentEnrolled / capacity) * 100 : 0;

      return {
        id: c.id,
        namaKelas: c.namaKelas,
        tipe: c.tipe,
        kategori: c.kategori,
        currentEnrolled,
        maxCapacity: capacity,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
      };
    });

    // Sort by occupancy and popular
    const popularClasses = [...classStats].sort((a, b) => b.currentEnrolled - a.currentEnrolled);

    return {
      classes: classStats,
      popularClasses,
    };
  }

  async getPayments() {
    const [payments, invoices] = await Promise.all([
      this.prisma.payment.findMany(),
      this.prisma.invoice.findMany(),
    ]);

    // Payment collection rate from invoices
    const paidInvoices = invoices.filter((i) => i.status === 'PAID');
    const unpaidInvoices = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED');
    const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');

    const totalInvoiceAmount = invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
    const collectedAmount = paidInvoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
    const uncollectedAmount = unpaidInvoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);

    const collectionRate = totalInvoiceAmount > 0 ? (collectedAmount / totalInvoiceAmount) * 100 : 0;

    // Payment method metrics
    const paymentMethods: { [key: string]: number } = {};
    payments.forEach((p) => {
      paymentMethods[p.paymentMethod] = (paymentMethods[p.paymentMethod] || 0) + Number(p.amount);
    });

    return {
      invoices: {
        total: invoices.length,
        paid: paidInvoices.length,
        unpaid: unpaidInvoices.length,
        overdue: overdueInvoices.length,
        totalAmount: totalInvoiceAmount,
        collectedAmount,
        uncollectedAmount,
        collectionRate: Math.round(collectionRate * 10) / 10,
      },
      paymentMethods,
    };
  }

  async getForecast() {
    try {
      const { monthlyTrend } = await this.getRevenue();

      // Need at least 2 points to perform linear regression
      if (!monthlyTrend || monthlyTrend.length < 2) {
        return {
          forecast: [],
          message: 'Data pendapatan kurang untuk melakukan peramalan (minimal 2 bulan data).',
        };
      }

      // Prepare data for Linear Regression (y = mx + c)
      const n = monthlyTrend.length;
      const x = Array.from({ length: n }, (_, i) => i); // Month index 0, 1, 2...
      const y = monthlyTrend.map((m) => m.profit);

      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;

      for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumXX += x[i] * x[i];
      }

      const denom = (n * sumXX - sumX * sumX);
      if (denom === 0) {
        return { forecast: [], equation: 'y = 0' };
      }

      // slope m and intercept c
      const m = (n * sumXY - sumX * sumY) / denom;
      const c = (sumY - m * sumX) / n;

      // Forecast next 3 days safely
      const forecast: { period: string; profit: number }[] = [];
      const lastItem = monthlyTrend[n - 1];
      const baseDate = lastItem?.date ? new Date(lastItem.date) : new Date();

      for (let i = 1; i <= 3; i++) {
        const forecastX = n - 1 + i;
        const forecastProfit = m * forecastX + c;

        const nextDate = new Date(baseDate);
        nextDate.setDate(nextDate.getDate() + i);
        const nextPeriod = nextDate.toISOString().split('T')[0];

        forecast.push({
          period: nextPeriod,
          profit: Math.max(0, Math.round(forecastProfit)), // Floor to 0 if negative profit
        });
      }

      return {
        forecast,
        equation: `y = ${m.toFixed(2)}x + ${c.toFixed(2)}`,
      };
    } catch (err) {
      console.error('Forecast Calculation Error:', err);
      return {
        forecast: [],
        message: 'Kalkulasi peramalan belum dapat dilakukan.',
      };
    }
  }

  async getDashboardSummary(query?: AnalyticsQueryDto) {
    const [revenue, students, classes, payments, forecast] = await Promise.all([
      this.getRevenue(query),
      this.getStudents(),
      this.getClasses(),
      this.getPayments(),
      this.getForecast(),
    ]);

    return {
      revenue,
      students,
      classes,
      payments,
      forecast,
      totalPendapatan: revenue.summary.totalIncome,
      totalPengeluaran: revenue.summary.totalExpense,
      monthlyTrend: revenue.monthlyTrend,
      range: revenue.range,
    };
  }

  private getMonthYearKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
}
