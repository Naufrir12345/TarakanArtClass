import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto) {
    // 1. Pastikan Role tersedia, jika tidak buat dulu
    const roleName = dto.role || 'ADMIN';

    let role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      // Jika role belum ada, buatkan secara otomatis
      role = await this.prisma.role.create({
        data: { name: roleName },
      });
    }

    // 2. Lanjutkan registrasi user
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        roleId: role.id, // Menggunakan roleId langsung lebih stabil
      },
      include: { role: true },
    });

    const token = this.generateToken(user.id, user.email, user.role.name);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: { id: user.role.id, name: user.role.name } },
      access_token: token,
    };
  }

  async login(dto: LoginDto) {
    const superadminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@manufindo.com';
    const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'superadmin123';

    if (dto.email === superadminEmail && dto.password === superadminPassword) {
      const token = this.generateToken('superadmin-static-id', superadminEmail, 'SUPERADMIN');
      return {
        user: {
          id: 'superadmin-static-id',
          name: 'Super Admin',
          email: superadminEmail,
          role: { id: 'superadmin-role-id', name: 'SUPERADMIN' },
        },
        access_token: token,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });


    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const token = this.generateToken(user.id, user.email, user.role.name);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: { id: user.role.id, name: user.role.name },
      },
      access_token: token,
    };
  }

  async getProfile(userId: string) {
    const superadminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@manufindo.com';

    if (userId === 'superadmin-static-id') {
      return {
        id: 'superadmin-static-id',
        name: 'Super Admin',
        email: superadminEmail,
        role: { id: 'superadmin-role-id', name: 'SUPERADMIN' },
        createdAt: new Date(),
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    return user;
  }

  private generateToken(userId: string, email: string, role: string): string {
    // KUNCINYA: Pastikan secret di sini SAMA dengan di JwtStrategy
    return this.jwtService.sign(
      { sub: userId, email, role },
      { secret: process.env.JWT_SECRET || 'manufindo-secret-key-2026' }
    );
  }
}
