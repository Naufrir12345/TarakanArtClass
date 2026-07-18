import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // ---- ITEMS ----
  async findAllItems() {
    return this.prisma.inventoryItem.findMany({
      where: { isActive: true },
      orderBy: { namaItem: 'asc' },
      include: {
        _count: { select: { sales: true } },
      },
    });
  }

  async createItem(dto: {
    namaItem: string;
    kategori: string;
    hargaBeli: number;
    hargaJual: number;
    stok: number;
    satuan?: string;
    deskripsi?: string;
  }) {
    return this.prisma.inventoryItem.create({ data: dto });
  }

  async updateItem(
    id: string,
    dto: {
      namaItem?: string;
      kategori?: string;
      hargaBeli?: number;
      hargaJual?: number;
      stok?: number;
      satuan?: string;
      deskripsi?: string;
    },
  ) {
    await this.findOneItem(id);
    return this.prisma.inventoryItem.update({ where: { id }, data: dto });
  }

  async removeItem(id: string) {
    await this.findOneItem(id);
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findOneItem(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: { sales: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!item) throw new NotFoundException('Item inventaris tidak ditemukan');
    return item;
  }

  // ---- SALES (dengan auto-income ke KeuanganPage) ----
  async recordSale(dto: {
    itemId: string;
    qty: number;
    pembeli?: string;
    catatan?: string;
  }) {
    const item = await this.findOneItem(dto.itemId);

    if (item.stok < dto.qty) {
      throw new Error(`Stok tidak mencukupi. Stok tersedia: ${item.stok}`);
    }

    const totalHarga = Number(item.hargaJual) * dto.qty;

    // Transaksional: kurangi stok + buat sale + buat income entry
    const [sale] = await this.prisma.$transaction([
      // 1. Buat catatan penjualan
      this.prisma.inventorySale.create({
        data: {
          itemId: dto.itemId,
          qty: dto.qty,
          hargaJual: item.hargaJual,
          totalHarga,
          pembeli: dto.pembeli,
          catatan: dto.catatan,
        },
      }),
      // 2. Kurangi stok
      this.prisma.inventoryItem.update({
        where: { id: dto.itemId },
        data: { stok: { decrement: dto.qty } },
      }),
      // 3. Catat otomatis ke tabel Income (berkorelasi dengan KeuanganPage)
      this.prisma.income.create({
        data: {
          amount: totalHarga,
          category: 'Penjualan Inventaris',
          note: `Penjualan ${dto.qty} ${item.satuan} ${item.namaItem}${dto.pembeli ? ` kepada ${dto.pembeli}` : ''}`,
          date: new Date(),
        },
      }),
    ]);

    return {
      sale,
      totalHarga,
      message: `Penjualan berhasil dicatat. Rp ${totalHarga.toLocaleString('id-ID')} telah ditambahkan ke Keuangan.`,
    };
  }

  async findAllSales() {
    return this.prisma.inventorySale.findMany({
      include: { item: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ---- SUMMARY untuk dashboard ----
  async getSummary() {
    const [items, totalItems, lowStockItems, todaySales] = await Promise.all([
      this.prisma.inventoryItem.findMany({ where: { isActive: true } }),
      this.prisma.inventoryItem.count({ where: { isActive: true } }),
      this.prisma.inventoryItem.count({ where: { isActive: true, stok: { lte: 5 } } }),
      this.prisma.inventorySale.aggregate({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { totalHarga: true },
        _count: true,
      }),
    ]);

    const totalStokValue = items.reduce((acc, i) => acc + Number(i.hargaBeli) * i.stok, 0);

    return {
      totalItems,
      lowStockItems,
      totalStokValue,
      todayRevenue: Number(todaySales._sum.totalHarga || 0),
      todayTransactions: todaySales._count,
    };
  }
}
