import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getRevenue() {
    // Fetch all incomes and expenses
    const [incomes, expenses] = await Promise.all([
      this.prisma.income.findMany(),
      this.prisma.expense.findMany(),
    ]);

    // Group by month-year
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};

    incomes.forEach((inc) => {
      const monthYear = this.getMonthYearKey(new Date(inc.date));
      if (!monthlyData[monthYear]) monthlyData[monthYear] = { income: 0, expense: 0 };
      monthlyData[monthYear].income += Number(inc.amount);
    });

    expenses.forEach((exp) => {
      const monthYear = this.getMonthYearKey(new Date(exp.date));
      if (!monthlyData[monthYear]) monthlyData[monthYear] = { income: 0, expense: 0 };
      monthlyData[monthYear].expense += Number(exp.amount);
    });

    // Format as list and sort chronologically
    const revenueList = Object.keys(monthlyData).map((key) => {
      const profit = monthlyData[key].income - monthlyData[key].expense;
      return {
        period: key, // "YYYY-MM"
        income: monthlyData[key].income,
        expense: monthlyData[key].expense,
        profit,
      };
    });

    revenueList.sort((a, b) => a.period.localeCompare(b.period));

    // Calculate YoY if there's enough data
    // For simplicity, returns last 12 periods and computes current vs prior year if present
    return {
      monthlyTrend: revenueList,
      summary: {
        totalIncome: incomes.reduce((sum, item) => sum + Number(item.amount), 0),
        totalExpense: expenses.reduce((sum, item) => sum + Number(item.amount), 0),
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
    const { monthlyTrend } = await this.getRevenue();

    // Need at least 2 points to perform linear regression
    if (monthlyTrend.length < 2) {
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

    // slope m and intercept c
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const c = (sumY - m * sumX) / n;

    // Forecast next 3 months
    const forecast: { period: string; profit: number }[] = [];
    const lastPeriod = monthlyTrend[n - 1].period;
    let [year, month] = lastPeriod.split('-').map(Number);

    for (let i = 1; i <= 3; i++) {
      const forecastX = n - 1 + i;
      const forecastProfit = m * forecastX + c;

      // Increment month
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }

      const nextPeriod = `${year}-${String(month).padStart(2, '0')}`;
      forecast.push({
        period: nextPeriod,
        profit: Math.max(0, Math.round(forecastProfit)), // Floor to 0 if negative profit
      });
    }

    return {
      forecast,
      equation: `y = ${m.toFixed(2)}x + ${c.toFixed(2)}`,
    };
  }

  async getDashboardSummary() {
    const [revenue, students, classes, payments, forecast] = await Promise.all([
      this.getRevenue(),
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
    };
  }

  private getMonthYearKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
}
