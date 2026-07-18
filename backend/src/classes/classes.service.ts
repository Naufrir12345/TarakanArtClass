import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.class.findMany({
      orderBy: { namaKelas: 'asc' },
      include: {
        _count: {
          select: {
            enrollments: true,
            schedules: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      include: {
        enrollments: { include: { student: true } },
        schedules: { include: { student: true } },
        _count: {
          select: { enrollments: true, schedules: true },
        },
      },
    });

    if (!cls) {
      throw new NotFoundException('Kelas tidak ditemukan');
    }

    return cls;
  }

  async create(dto: CreateClassDto) {
    return this.prisma.class.create({
      data: {
        namaKelas: dto.namaKelas,
        tipe: dto.tipe,
        harga: dto.harga,
        kategori: dto.kategori || 'REGULAR',
        maxCapacity: dto.maxCapacity || 10,
        description: dto.description,
      },
    });
  }

  async update(id: string, dto: UpdateClassDto) {
    await this.findOne(id);
    return this.prisma.class.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.class.delete({ where: { id } });
  }
}
