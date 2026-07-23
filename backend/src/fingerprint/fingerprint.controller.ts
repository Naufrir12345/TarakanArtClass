import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FingerprintService } from './fingerprint.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('fingerprint')
export class FingerprintController {
  constructor(private readonly fingerprintService: FingerprintService) {}

  @UseGuards(JwtAuthGuard)
  @Post('register/:studentId')
  register(
    @Param('studentId') studentId: string,
    @Body('templateData') templateData: string,
    @Body('fingerIndex') fingerIndex?: string,
  ) {
    return this.fingerprintService.register(studentId, templateData, fingerIndex);
  }

  // Biometric device verification hook (can be public for hardware connection or guarded)
  @Post('verify')
  verify(@Body('templateData') templateData: string) {
    return this.fingerprintService.verify(templateData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('student/:studentId')
  getFingerprintsByStudent(@Param('studentId') studentId: string) {
    return this.fingerprintService.getFingerprintsByStudent(studentId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteFingerprint(@Param('id') id: string) {
    return this.fingerprintService.deleteFingerprint(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('attendance/today')
  getTodayAttendance() {
    return this.fingerprintService.getTodayAttendance();
  }

  // Real-time integration from biometric devices
  @Post('push-attendance')
  pushAttendance(
    @Body('deviceEmployeeId') deviceEmployeeId: string,
    @Body('timestamp') timestamp?: string,
  ) {
    return this.fingerprintService.recordAttendanceByDeviceId(
      deviceEmployeeId,
      timestamp ? new Date(timestamp) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('registered-list')
  getRegisteredList() {
    return this.fingerprintService.getAllRegisteredFingerprints();
  }

  // Bulk CSV importing for offline logs transfer
  @UseGuards(JwtAuthGuard)
  @Post('import-csv')
  importCsv(@Body('csvText') csvText: string) {
    return this.fingerprintService.importCsvAttendance(csvText);
  }
}
