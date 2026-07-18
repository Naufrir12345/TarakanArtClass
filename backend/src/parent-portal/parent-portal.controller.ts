import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ParentPortalService } from './parent-portal.service';
import { ParentLoginDto } from './dto/parent-login.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class ParentPortalController {
  constructor(private readonly parentService: ParentPortalService) {}

  // ===================================
  // Parent Portal Routes (Parent Facing)
  // ===================================

  @Post('parent/login')
  login(@Body() loginDto: ParentLoginDto) {
    return this.parentService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('parent/profile')
  getProfile(@Req() req: any) {
    // sub corresponds to parent account id
    return this.parentService.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('parent/children/:childId/schedule')
  getChildSchedule(@Req() req: any, @Param('childId') childId: string) {
    return this.parentService.getChildSchedule(req.user.sub, childId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('parent/children/:childId/reports')
  getChildReports(@Req() req: any, @Param('childId') childId: string) {
    return this.parentService.getChildReports(req.user.sub, childId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('parent/children/:childId/payments')
  getChildPayments(@Req() req: any, @Param('childId') childId: string) {
    return this.parentService.getChildPayments(req.user.sub, childId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('parent/children/:childId/attendance')
  getChildAttendance(@Req() req: any, @Param('childId') childId: string) {
    return this.parentService.getChildAttendance(req.user.sub, childId);
  }

  // =====================================
  // Admin Management Routes (Admin Facing)
  // =====================================

  @UseGuards(JwtAuthGuard)
  @Get('parent-accounts')
  adminFindAll() {
    return this.parentService.adminFindAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('parent-accounts/:id')
  adminFindOne(@Param('id') id: string) {
    return this.parentService.adminFindOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('parent-accounts')
  adminCreate(@Body() data: any) {
    return this.parentService.adminCreate(data);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('parent-accounts/:id')
  adminUpdate(@Param('id') id: string, @Body() data: any) {
    return this.parentService.adminUpdate(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('parent-accounts/:id')
  adminRemove(@Param('id') id: string) {
    return this.parentService.adminRemove(id);
  }
}
