import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import * as crypto from 'crypto';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInvoiceDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) {
      throw new NotFoundException('Siswa tidak ditemukan');
    }

    // Generate Invoice Number: INV-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: `INV-${currentYear}-`,
        },
      },
    });
    const seq = String(count + 1).padStart(4, '0');
    const invoiceNumber = `INV-${currentYear}-${seq}`;

    // Calculate total amount
    const totalAmount = dto.items.reduce((sum, item) => {
      const qty = item.quantity || 1;
      return sum + Number(item.amount) * qty;
    }, 0);

    // Save to database
    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        studentId: dto.studentId,
        totalAmount,
        status: 'DRAFT',
        dueDate: new Date(dto.dueDate),
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            description: item.description,
            amount: item.amount,
            quantity: item.quantity || 1,
          })),
        },
      },
      include: {
        items: true,
        student: true,
      },
    });
  }

  async findAll(query: { status?: string; studentId?: string }) {
    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.studentId) {
      where.studentId = query.studentId;
    }
    return this.prisma.invoice.findMany({
      where,
      include: {
        student: true,
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        student: true,
        items: true,
      },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice tidak ditemukan');
    }
    return invoice;
  }

  async update(id: string, data: any) {
    const invoice = await this.findOne(id);

    // Calculate total if items updated
    let totalAmount = invoice.totalAmount;
    if (data.items) {
      totalAmount = data.items.reduce((sum: number, item: any) => {
        const qty = item.quantity || 1;
        return sum + Number(item.amount) * qty;
      }, 0);
    }

    // Delete existing items if updating items
    if (data.items) {
      await this.prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        notes: data.notes,
        totalAmount: data.items ? totalAmount : undefined,
        items: data.items
          ? {
              create: data.items.map((item: any) => ({
                description: item.description,
                amount: item.amount,
                quantity: item.quantity || 1,
              })),
            }
          : undefined,
      },
      include: {
        items: true,
        student: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.invoice.delete({
      where: { id },
    });
  }

  async getPaymentLink(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        student: true,
        items: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice tidak ditemukan');
    }

    // If snap token already exists, just return it
    if (invoice.snapToken && invoice.snapUrl) {
      return {
        snapToken: invoice.snapToken,
        snapUrl: invoice.snapUrl,
      };
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

    // If Server Key is not set, fallback to Mock Midtrans mode
    if (!serverKey) {
      this.logger.warn('MIDTRANS_SERVER_KEY is not defined. Using mock payment gateway.');
      const mockToken = `mock-snap-token-${crypto.randomBytes(8).toString('hex')}`;
      const mockUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${mockToken}`;

      await this.prisma.invoice.update({
        where: { id },
        data: {
          snapToken: mockToken,
          snapUrl: mockUrl,
          paymentGateway: 'MIDTRANS',
          status: 'SENT',
        },
      });

      return {
        snapToken: mockToken,
        snapUrl: mockUrl,
      };
    }

    const midtransUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const authHeader = Buffer.from(`${serverKey}:`).toString('base64');

    const payload = {
      transaction_details: {
        order_id: invoice.id,
        gross_amount: Number(invoice.totalAmount),
      },
      customer_details: {
        first_name: invoice.student.namaOrtu,
        email: invoice.student.emailOrtu,
        phone: invoice.student.noHpOrtu,
      },
      item_details: invoice.items.map((item) => ({
        id: item.id,
        price: Number(item.amount),
        quantity: item.quantity,
        name: item.description.substring(0, 50),
      })),
    };

    try {
      const response = await fetch(midtransUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Midtrans API error: ${response.status} - ${errorText}`);
        throw new BadRequestException(`Gagal menghubungi payment gateway: ${errorText}`);
      }

      const result = await response.json();

      await this.prisma.invoice.update({
        where: { id },
        data: {
          snapToken: result.token,
          snapUrl: result.redirect_url,
          paymentGateway: 'MIDTRANS',
          status: 'SENT',
        },
      });

      return {
        snapToken: result.token,
        snapUrl: result.redirect_url,
      };
    } catch (error) {
      this.logger.error('Failed to create Midtrans transaction', error);
      throw new BadRequestException('Koneksi ke payment gateway gagal');
    }
  }

  async handleWebhook(body: any) {
    this.logger.log(`Received Midtrans webhook: ${JSON.stringify(body)}`);

    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      status_code,
      signature_key,
    } = body;

    if (!order_id) {
      throw new BadRequestException('Invalid webhook payload (missing order_id)');
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: order_id },
      include: { student: true },
    });

    if (!invoice) {
      this.logger.error(`Invoice with order_id ${order_id} not found in database.`);
      return { status: 'ignored', message: 'Invoice not found' };
    }

    // Validate Signature Key if Server Key is set
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (serverKey && signature_key) {
      const hashInput = `${order_id}${status_code}${gross_amount}${serverKey}`;
      const calculatedSignature = crypto.createHash('sha512').update(hashInput).digest('hex');

      if (calculatedSignature !== signature_key) {
        this.logger.error('Midtrans signature verification failed!');
        throw new BadRequestException('Invalid signature key');
      }
    }

    let invoiceStatus = invoice.status;
    let paidAt = invoice.paidAt;

    if (
      transaction_status === 'capture' ||
      transaction_status === 'settlement'
    ) {
      if (fraud_status === 'challenge') {
        invoiceStatus = 'SENT';
      } else {
        invoiceStatus = 'PAID';
        paidAt = new Date();

        // Create Income entry in accounting module
        await this.prisma.income.create({
          data: {
            amount: invoice.totalAmount,
            category: 'TUITION_FEE',
            note: `Pembayaran Invoice ${invoice.invoiceNumber} (${invoice.student.namaAnak})`,
            date: new Date(),
          },
        });
      }
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny'
    ) {
      invoiceStatus = 'CANCELLED';
    } else if (transaction_status === 'expire') {
      invoiceStatus = 'OVERDUE';
    } else if (transaction_status === 'pending') {
      invoiceStatus = 'SENT';
    }

    await this.prisma.invoice.update({
      where: { id: order_id },
      data: {
        status: invoiceStatus,
        paidAt,
      },
    });

    this.logger.log(`Invoice ${invoice.invoiceNumber} status updated to ${invoiceStatus}`);

    return { status: 'success', invoiceStatus };
  }
}
