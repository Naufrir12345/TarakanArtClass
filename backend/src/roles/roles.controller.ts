import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  // --- READ OPERATIONS (Bisa diakses Admin & Superadmin) ---

  @Roles('SUPERADMIN', 'SUPER_ADMIN', 'ADMIN')
  @Get('permissions')
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Roles('SUPERADMIN', 'SUPER_ADMIN', 'ADMIN')
  @Get('users')
  findAllUsers() {
    return this.rolesService.findAllUsers();
  }

  @Roles('SUPERADMIN', 'SUPER_ADMIN', 'ADMIN')
  @Get()
  findAllRoles() {
    return this.rolesService.findAllRoles();
  }

  @Roles('SUPERADMIN', 'SUPER_ADMIN', 'ADMIN')
  @Get(':id')
  findRoleById(@Param('id') id: string) {
    return this.rolesService.findRoleById(id);
  }

  // --- WRITE/MODIFY OPERATIONS (Hanya Superadmin) ---

  @Roles('SUPERADMIN', 'SUPER_ADMIN')
  @Post('permissions')
  createPermission(@Body() body: { action: string }) {
    return this.rolesService.createPermission(body);
  }

  @Roles('SUPERADMIN', 'SUPER_ADMIN')
  @Post('assign-user')
  assignUserPost(@Body() body: { userId: string; roleId: string }) {
    return this.rolesService.assignRoleToUser(body.userId, body.roleId);
  }

  @Roles('SUPERADMIN', 'SUPER_ADMIN')
  @Post()
  createRole(@Body() body: { name: string; permissionIds?: string[] }) {
    return this.rolesService.createRole(body);
  }

  @Roles('SUPERADMIN', 'SUPER_ADMIN')
  @Patch('users/:userId/role')
  assignRole(@Param('userId') userId: string, @Body() body: { roleId: string }) {
    return this.rolesService.assignRoleToUser(userId, body.roleId);
  }

  @Roles('SUPERADMIN', 'SUPER_ADMIN')
  @Patch(':id/permissions/assign')
  assignPermission(
    @Param('id') id: string,
    @Body('permissionId') permissionId: string,
  ) {
    return this.rolesService.assignPermissionToRole(id, permissionId);
  }

  @Roles('SUPERADMIN', 'SUPER_ADMIN')
  @Patch(':id/permissions/revoke')
  revokePermission(
    @Param('id') id: string,
    @Body('permissionId') permissionId: string,
  ) {
    return this.rolesService.revokePermissionFromRole(id, permissionId);
  }

  @Roles('SUPERADMIN', 'SUPER_ADMIN')
  @Patch(':id')
  updateRole(@Param('id') id: string, @Body() body: { name?: string; permissionIds?: string[] }) {
    return this.rolesService.updateRole(id, body);
  }

  @Roles('SUPERADMIN', 'SUPER_ADMIN')
  @Delete('permissions/:id')
  deletePermission(@Param('id') id: string) {
    return this.rolesService.deletePermission(id);
  }

  @Roles('SUPERADMIN', 'SUPER_ADMIN')
  @Delete(':id')
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }

  // --- STAFF MANAGEMENT OPERATIONS (Hanya Superadmin) ---

  @Roles('SUPERADMIN', 'SUPER_ADMIN')
  @Post('users')
  createUser(@Body() body: { name: string; email: string; password?: string; roleId: string; salary?: number }) {
    return this.rolesService.createUser(body);
  }

  @Roles('SUPERADMIN', 'SUPER_ADMIN')
  @Delete('users/:userId')
  deleteUser(@Param('userId') userId: string) {
    return this.rolesService.deleteUser(userId);
  }

  @Roles('SUPERADMIN', 'SUPER_ADMIN')
  @Patch('users/:userId/salary')
  updateSalary(@Param('userId') userId: string, @Body() body: { salary: number }) {
    return this.rolesService.updateUserSalary(userId, body.salary);
  }
}