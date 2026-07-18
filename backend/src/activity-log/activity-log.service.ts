import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    targetTable?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.targetTable) where.targetTable = query.targetTable;
    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = new Date(query.startDate);
      if (query.endDate) where.timestamp.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      totalPages: Math.ceil(total / limit),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByUser(userId: string) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }

  async log(userId: string, action: string, targetTable: string, targetId?: string, details?: string) {
    return this.prisma.auditLog.create({
      data: { userId, action, targetTable, targetId, details },
    });
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalToday, totalAll, topUsers] = await Promise.all([
      this.prisma.auditLog.count({ where: { timestamp: { gte: today } } }),
      this.prisma.auditLog.count(),
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    return { totalToday, totalAll, topUsers };
  }
}
