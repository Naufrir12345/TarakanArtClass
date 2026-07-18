import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AccurateService {
  private readonly logger = new Logger(AccurateService.name);
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiryTime: number | null = null;

  constructor(private prisma: PrismaService) {}

  getConnectUrl(): string {
    const clientId = process.env.ACCURATE_CLIENT_ID || 'mock_client_id';
    // const redirectUri = 'http://localhost:3000/api/accurate/callback'; // local testing
    const redirectUri = process.env.ACCURATE_REDIRECT_URI || 'https://tarakanartclass-production.up.railway.app/api/accurate/callback';
    const scope = 'sales_invoice expense';
    
    // Accurate OAuth Auth URL
    return `https://accurate.id/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scope)}`;
  }

  async handleCallback(code: string) {
    const clientId = process.env.ACCURATE_CLIENT_ID;
    const clientSecret = process.env.ACCURATE_CLIENT_SECRET;
    // const redirectUri = 'http://localhost:3000/api/accurate/callback'; // local testing
    const redirectUri = process.env.ACCURATE_REDIRECT_URI || 'https://tarakanartclass-production.up.railway.app/api/accurate/callback';

    if (!clientId || !clientSecret) {
      this.logger.warn('Accurate client credentials not defined. Storing mock tokens.');
      this.accessToken = `mock_access_token_${Date.now()}`;
      this.refreshToken = `mock_refresh_token_${Date.now()}`;
      this.expiryTime = Date.now() + 3600 * 1000;
      return { success: true, message: 'Connected to mock Accurate Online API' };
    }

    try {
      const response = await fetch('https://accurate.id/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Accurate OAuth error: ${response.status} - ${errorText}`);
        throw new BadRequestException(`Gagal bertukar token dengan Accurate: ${errorText}`);
      }

      const result = await response.json();
      this.accessToken = result.access_token;
      this.refreshToken = result.refresh_token;
      this.expiryTime = Date.now() + (result.expires_in || 3600) * 1000;

      return { success: true, message: 'Berhasil terhubung dengan Accurate Online!' };
    } catch (error) {
      this.logger.error('Failed exchanging Accurate code', error);
      throw new BadRequestException('Koneksi ke Accurate gagal');
    }
  }

  getConnectionStatus() {
    return {
      connected: !!this.accessToken,
      expiresAt: this.expiryTime ? new Date(this.expiryTime) : null,
      isMock: !process.env.ACCURATE_CLIENT_ID,
    };
  }

  async syncInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { student: true, items: true },
    });

    if (!invoice) throw new BadRequestException('Invoice tidak ditemukan');

    // Create a pending sync log
    const syncLog = await this.prisma.accurateSyncLog.create({
      data: {
        syncType: 'INVOICE',
        referenceId: invoiceId,
        status: 'PENDING',
      },
    });

    const requestBody = JSON.stringify({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.student.namaOrtu,
      email: invoice.student.emailOrtu,
      phone: invoice.student.noHpOrtu,
      transDate: invoice.createdAt.toISOString().split('T')[0],
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      detailItems: invoice.items.map((item) => ({
        detailName: item.description,
        unitPrice: Number(item.amount),
        quantity: item.quantity,
      })),
    });

    // Update log with request payload
    await this.prisma.accurateSyncLog.update({
      where: { id: syncLog.id },
      data: { request: requestBody },
    });

    if (!this.accessToken) {
      // Simulate sync in dev/mock mode
      await new Promise((res) => setTimeout(res, 500));
      await this.prisma.accurateSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'SUCCESS',
          response: JSON.stringify({ status: 'SUCCESS', message: 'Mock synced', invoiceNumber: invoice.invoiceNumber }),
          syncedAt: new Date(),
        },
      });
      return { success: true, message: 'Invoice synced to mock Accurate' };
    }

    try {
      const response = await fetch('https://api.accurate.id/api/sales-invoice/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: requestBody,
      });

      const responseText = await response.text();

      if (!response.ok) {
        await this.prisma.accurateSyncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'FAILED',
            errorLog: `HTTP ${response.status}: ${responseText}`,
          },
        });
        return { success: false, error: responseText };
      }

      await this.prisma.accurateSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'SUCCESS',
          response: responseText,
          syncedAt: new Date(),
        },
      });

      return { success: true };
    } catch (err) {
      await this.prisma.accurateSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          errorLog: err.message || err.toString(),
        },
      });
      return { success: false, error: err.message };
    }
  }

  async syncExpense(expenseId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) throw new BadRequestException('Pengeluaran tidak ditemukan');

    const syncLog = await this.prisma.accurateSyncLog.create({
      data: {
        syncType: 'EXPENSE',
        referenceId: expenseId,
        status: 'PENDING',
      },
    });

    const requestBody = JSON.stringify({
      transDate: expense.date.toISOString().split('T')[0],
      amount: Number(expense.amount),
      description: `[Expense ${expense.category}] ${expense.note || ''}`,
    });

    await this.prisma.accurateSyncLog.update({
      where: { id: syncLog.id },
      data: { request: requestBody },
    });

    if (!this.accessToken) {
      await new Promise((res) => setTimeout(res, 500));
      await this.prisma.accurateSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'SUCCESS',
          response: JSON.stringify({ status: 'SUCCESS', message: 'Mock synced' }),
          syncedAt: new Date(),
        },
      });
      return { success: true, message: 'Expense synced to mock Accurate' };
    }

    try {
      const response = await fetch('https://api.accurate.id/api/expense/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: requestBody,
      });

      const responseText = await response.text();

      if (!response.ok) {
        await this.prisma.accurateSyncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'FAILED',
            errorLog: `HTTP ${response.status}: ${responseText}`,
          },
        });
        return { success: false, error: responseText };
      }

      await this.prisma.accurateSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'SUCCESS',
          response: responseText,
          syncedAt: new Date(),
        },
      });

      return { success: true };
    } catch (err) {
      await this.prisma.accurateSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          errorLog: err.message || err.toString(),
        },
      });
      return { success: false, error: err.message };
    }
  }

  async getSyncLogs() {
    return this.prisma.accurateSyncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // Daily auto sync cron job
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyAutoSync() {
    this.logger.log('Running daily Accurate Online auto sync cron...');
    
    // Find all invoices created in the last 24h that aren't synced successfully
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const unsyncedInvoices = await this.prisma.invoice.findMany({
      where: {
        createdAt: { gte: yesterday },
        status: 'PAID', // Only sync paid invoices to Accurate
      },
    });

    for (const inv of unsyncedInvoices) {
      const alreadySynced = await this.prisma.accurateSyncLog.findFirst({
        where: {
          syncType: 'INVOICE',
          referenceId: inv.id,
          status: 'SUCCESS',
        },
      });

      if (!alreadySynced) {
        this.logger.log(`Auto syncing invoice ${inv.invoiceNumber} to Accurate...`);
        await this.syncInvoice(inv.id);
      }
    }
  }
}
