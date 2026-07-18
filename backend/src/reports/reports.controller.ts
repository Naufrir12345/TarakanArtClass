import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { AddGradeDto } from './dto/add-grade.dto';
import { VerifyCredentialDto } from './dto/verify-credential.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateReportDto) {
    return this.reportsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/grades')
  addGrade(@Param('id') id: string, @Body() dto: AddGradeDto) {
    return this.reportsService.addGrade(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('grades/:gradeId')
  removeGrade(@Param('gradeId') gradeId: string) {
    return this.reportsService.removeGrade(gradeId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportsService.remove(id);
  }

  // Public verification endpoint for parents
  @Post('verify')
  verifyCredential(@Body() dto: VerifyCredentialDto) {
    return this.reportsService.verifyCredential(dto.credentialKey);
  }
}
