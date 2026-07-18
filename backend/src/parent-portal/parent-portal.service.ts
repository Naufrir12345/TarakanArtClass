import { Injectable, NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ParentLoginDto } from './dto/parent-login.dto';

@Injectable()
export class ParentPortalService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ==========================
  // Parent Authentication
  // ==========================
  async login(dto: ParentLoginDto) {
    const parent = await this.prisma.parentAccount.findUnique({
      where: { email: dto.email },
      include: {
        students: true,
      },
    });

    if (!parent || !parent.isActive) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, parent.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const token = this.jwtService.sign({
      sub: parent.id,
      email: parent.email,
      role: 'PARENT',
    });

    return {
      parent: {
        id: parent.id,
        name: parent.name,
        email: parent.email,
        phone: parent.phone,
        students: parent.students,
      },
      access_token: token,
    };
  }

  async getProfile(parentId: string) {
    const parent = await this.prisma.parentAccount.findUnique({
      where: { id: parentId },
      include: {
        students: {
          include: {
            enrollments: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Akun orang tua tidak ditemukan');
    }

    // Omit password
    const { password, ...result } = parent;
    return result;
  }

  // ==========================
  // Child Portal Data
  // ==========================
  async getChildSchedule(parentId: string, childId: string) {
    await this.verifyParentChildRelation(parentId, childId);

    return this.prisma.schedule.findMany({
      where: { studentId: childId },
      include: {
        class: true,
      },
    });
  }

  async getChildReports(parentId: string, childId: string) {
    await this.verifyParentChildRelation(parentId, childId);

    return this.prisma.report.findMany({
      where: { studentId: childId },
      include: {
        grades: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getChildPayments(parentId: string, childId: string) {
    await this.verifyParentChildRelation(parentId, childId);

    const [invoices, payments] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { studentId: childId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.findMany({
        where: { studentId: childId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { invoices, payments };
  }

  async getChildAttendance(parentId: string, childId: string) {
    await this.verifyParentChildRelation(parentId, childId);

    return this.prisma.attendance.findMany({
      where: { studentId: childId },
      include: {
        class: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  private async verifyParentChildRelation(parentId: string, childId: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        id: childId,
        parentAccountId: parentId,
      },
    });

    if (!student) {
      throw new UnauthorizedException('Anda tidak memiliki akses ke data murid ini');
    }
  }

  // ==========================
  // Admin Management CRUD
  // ==========================
  async adminFindAll() {
    return this.prisma.parentAccount.findMany({
      include: {
        students: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async adminFindOne(id: string) {
    const parent = await this.prisma.parentAccount.findUnique({
      where: { id },
      include: {
        students: true,
      },
    });
    if (!parent) {
      throw new NotFoundException('Akun orang tua tidak ditemukan');
    }
    return parent;
  }

  async adminCreate(data: any) {
    const existing = await this.prisma.parentAccount.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('Email sudah digunakan');
    }

    const hashedPassword = await bcrypt.hash(data.password || 'password123', 10);

    const parent = await this.prisma.parentAccount.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    // If student ids are provided, link them
    if (data.studentIds && data.studentIds.length > 0) {
      await this.prisma.student.updateMany({
        where: { id: { in: data.studentIds } },
        data: { parentAccountId: parent.id },
      });
    }

    return this.adminFindOne(parent.id);
  }

  async adminUpdate(id: string, data: any) {
    const parent = await this.adminFindOne(id);

    let hashedPassword = parent.password;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    await this.prisma.parentAccount.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        isActive: data.isActive,
      },
    });

    // Handle student relations update
    if (data.studentIds) {
      // First, unlink previous students
      await this.prisma.student.updateMany({
        where: { parentAccountId: id },
        data: { parentAccountId: null },
      });

      // Link new students
      if (data.studentIds.length > 0) {
        await this.prisma.student.updateMany({
          where: { id: { in: data.studentIds } },
          data: { parentAccountId: id },
        });
      }
    }

    return this.adminFindOne(id);
  }

  async adminRemove(id: string) {
    await this.adminFindOne(id);

    // Unlink any children first
    await this.prisma.student.updateMany({
      where: { parentAccountId: id },
      data: { parentAccountId: null },
    });

    return this.prisma.parentAccount.delete({
      where: { id },
    });
  }
}
