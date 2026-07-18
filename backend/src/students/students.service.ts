import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { search?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where = query.search
      ? {
          OR: [
            { namaAnak: { contains: query.search, mode: 'insensitive' as const } },
            { namaOrtu: { contains: query.search, mode: 'insensitive' as const } },
            { emailOrtu: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          enrollments: {
            include: { class: true },
          },
          schedules: {
            include: { class: true },
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        enrollments: { include: { class: true } },
        schedules: { include: { class: true } },
        reports: { include: { grades: true } },
        payments: true,
        extraClasses: { include: { class: true } },
      },
    });

    if (!student) {
      throw new NotFoundException('Siswa tidak ditemukan');
    }

    return student;
  }

  async create(dto: CreateStudentDto) {
    return this.prisma.student.create({
      data: dto,
      include: {
        enrollments: true,
        schedules: true,
      },
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);

    return this.prisma.student.update({
      where: { id },
      data: dto,
      include: {
        enrollments: { include: { class: true } },
        schedules: { include: { class: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.student.delete({ where: { id } });
  }
}
