import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) { }

  async findAllRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: true, users: { select: { id: true, name: true, email: true } } },
    });
    if (!role) throw new NotFoundException('Role tidak ditemukan');
    return role;
  }

  async createRole(data: { name: string; permissionIds?: string[] }) {
    const existing = await this.prisma.role.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException('Role dengan nama ini sudah ada');

    return this.prisma.role.create({
      data: {
        name: data.name.toUpperCase(),
        permissions: data.permissionIds
          ? { connect: data.permissionIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { permissions: true },
    });
  }

  async updateRole(id: string, data: { name?: string; permissionIds?: string[] }) {
    await this.findRoleById(id);

    return this.prisma.role.update({
      where: { id },
      data: {
        name: data.name?.toUpperCase(),
        permissions: data.permissionIds
          ? { set: data.permissionIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { permissions: true },
    });
  }

  async deleteRole(id: string) {
    const role = await this.findRoleById(id);
    if (['ADMIN', 'SUPERADMIN', 'SUPER_ADMIN'].includes(role.name)) {
      throw new ConflictException('Tidak bisa menghapus role default sistem');
    }
    return this.prisma.role.delete({ where: { id } });
  }

  // Permission CRUD
  async findAllPermissions() {
    return this.prisma.permission.findMany({
      include: { _count: { select: { roles: true } } },
      orderBy: { action: 'asc' },
    });
  }

  async createPermission(data: { action: string }) {
    const existing = await this.prisma.permission.findUnique({ where: { action: data.action } });
    if (existing) throw new ConflictException('Permission ini sudah ada');

    return this.prisma.permission.create({
      data: { action: data.action.toUpperCase() },
    });
  }

  async deletePermission(id: string) {
    return this.prisma.permission.delete({ where: { id } });
  }

  // User role assignment
  async assignRoleToUser(userId: string, roleId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId },
      include: { role: { include: { permissions: true } } },
    });
  }

  async assignPermissionToRole(roleId: string, permissionId: string) {
    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          connect: { id: permissionId },
        },
      },
      include: { permissions: true },
    });
  }

  async revokePermissionFromRole(roleId: string, permissionId: string) {
    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          disconnect: { id: permissionId },
        },
      },
      include: { permissions: true },
    });
  }

  async findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        salary: true,
        role: { include: { permissions: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUser(data: { name: string; email: string; password?: string; roleId: string; salary?: number }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email ini sudah digunakan');

    const rawPassword = data.password || 'password123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        roleId: data.roleId,
        salary: data.salary || 0,
      },
      include: { role: true },
    });
  }

  async deleteUser(id: string) {
    // Prevent self-deletion if needed (handled in controller or let it delete)
    return this.prisma.user.delete({ where: { id } });
  }

  async updateUserSalary(id: string, salary: number) {
    return this.prisma.user.update({
      where: { id },
      data: { salary },
      select: { id: true, name: true, salary: true },
    });
  }
}
