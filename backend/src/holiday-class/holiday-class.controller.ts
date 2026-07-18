import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { HolidayClassService } from './holiday-class.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('holiday-class')
@UseGuards(JwtAuthGuard)
export class HolidayClassController {
  constructor(private readonly holidayClassService: HolidayClassService) {}

  @Get()
  findAll() {
    return this.holidayClassService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.holidayClassService.findOne(id);
  }

  @Post()
  create(@Body() body: {
    namaProgram: string;
    deskripsi?: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    harga: number;
    maxCapacity?: number;
  }) {
    return this.holidayClassService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.holidayClassService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.holidayClassService.remove(id);
  }

  // Enrollment
  @Post(':id/enroll')
  enrollStudent(@Param('id') id: string, @Body() body: { studentId: string }) {
    return this.holidayClassService.enrollStudent(id, body.studentId);
  }

  @Delete('enrollment/:enrollmentId')
  unenrollStudent(@Param('enrollmentId') enrollmentId: string) {
    return this.holidayClassService.unenrollStudent(enrollmentId);
  }

  // Schedule
  @Post(':id/schedule')
  addSchedule(@Param('id') id: string, @Body() body: {
    date: string;
    startTime: string;
    endTime: string;
    topic?: string;
  }) {
    return this.holidayClassService.addSchedule(id, body);
  }

  @Delete('schedule/:scheduleId')
  removeSchedule(@Param('scheduleId') scheduleId: string) {
    return this.holidayClassService.removeSchedule(scheduleId);
  }
}
