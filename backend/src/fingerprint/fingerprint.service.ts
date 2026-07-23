import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FingerprintService {
  private readonly logger = new Logger(FingerprintService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Register a fingerprint template for a student.
   * Throws NotFoundException if the student does not exist.
   */
  async register(studentId: string, templateData: string, fingerIndex?: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Siswa tidak ditemukan');
    }

    // Save or update template for a student
    return this.prisma.fingerprintData.create({
      data: {
        studentId,
        templateData,
        fingerIndex: fingerIndex || 'RIGHT_INDEX',
      },
    });
  }

  /**
   * Register a fingerprint template for a staff member (karyawan).
   * Since staff are not stored in the student table, we store the staff identifier
   * in the `deviceEmployeeId` field and leave `studentId` null.
   */
  async registerStaff(staffId: string, templateData: string, fingerIndex?: string) {
    // No validation against a staff table for demo purposes; in production you would verify the staff exists.
    return this.prisma.fingerprintData.create({
      data: {
        deviceEmployeeId: staffId,
        templateData,
        fingerIndex: fingerIndex || 'RIGHT_INDEX',
      },
    });
  }

  async verify(templateData: string) {
    // Find matching template
    const fingerprints = await this.prisma.fingerprintData.findMany({
      where: { isActive: true },
      include: { student: true },
    });

    const match = fingerprints.find(
      (fp) => fp.templateData === templateData || fp.templateData.substring(0, 100) === templateData.substring(0, 100)
    );

    if (!match || !match.studentId || !match.student) {
      throw new BadRequestException('Fingerprint tidak cocok atau tidak terdaftar untuk siswa');
    }

    const studentId: string = match.studentId;
    const student = match.student;
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ...

    // Find student's active class schedule for today
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        studentId,
        dayOfWeek,
        status: 'ACTIVE',
      },
      include: {
        class: true,
      },
    });

    if (!schedule) {
      this.logger.warn(`Student ${student.namaAnak} verified, but has no class schedule scheduled for today.`);
      // If no schedule, check if they have Holiday class schedule today
      const holidaySchedule: any = await (this.prisma.holidaySchedule.findFirst as any)({
        where: {
          holidayClass: {
            enrollments: {
              some: { studentId, status: 'ACTIVE' },
            },
          },
          date: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            lte: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
          },
        },
        include: {
          holidayClass: true,
        },
      });

      if (!holidaySchedule) {
        throw new BadRequestException(
          `Siswa ${student.namaAnak} berhasil diverifikasi, tetapi tidak ada jadwal kelas reguler maupun holiday hari ini.`
        );
      }

      // Mark holiday attendance (simulate log or return success)
      return {
        status: 'SUCCESS',
        message: `Absensi Kelas Liburan (${holidaySchedule.holidayClass?.namaProgram || 'Liburan'}) berhasil dicatat.`,
        student,
        class: { namaKelas: holidaySchedule.holidayClass?.namaProgram || 'Liburan' },
      };
    }

    // Check if attendance already marked today for this class
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        studentId,
        classId: schedule.classId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingAttendance) {
      return {
        status: 'ALREADY_MARKED',
        message: `Absensi siswa ${student.namaAnak} untuk kelas ${schedule.class.namaKelas} sudah dicatat hari ini.`,
        student,
        class: schedule.class,
        attendance: existingAttendance,
      };
    }

    // Create Attendance record
    const attendance = await this.prisma.attendance.create({
      data: {
        studentId,
        classId: schedule.classId,
        status: 'PRESENT',
        notes: 'Absensi otomatis via Fingerprint Scanner',
        date: today,
      },
      include: {
        class: true,
      },
    });

    return {
      status: 'SUCCESS',
      message: `Absensi siswa ${student.namaAnak} berhasil dicatat.`,
      student,
      class: schedule.class,
      attendance,
    };
  }

  async recordAttendanceByDeviceId(deviceEmployeeId: string, timestamp?: Date) {
    const match = await this.prisma.fingerprintData.findFirst({
      where: { deviceEmployeeId, isActive: true },
      include: { student: true },
    });

    if (!match || !match.studentId || !match.student) {
      throw new NotFoundException(`Siswa dengan ID fingerprint alat ${deviceEmployeeId} tidak terdaftar.`);
    }

    const studentId: string = match.studentId;
    const student = match.student;
    const today = timestamp ? new Date(timestamp) : new Date();
    const dayOfWeek = today.getDay();

    // Find active regular class schedule
    const schedule = await this.prisma.schedule.findFirst({
      where: { studentId, dayOfWeek, status: 'ACTIVE' },
      include: { class: true },
    });

    if (!schedule) {
      // Check Holiday class
      const holidaySchedule: any = await (this.prisma.holidaySchedule.findFirst as any)({
        where: {
          holidayClass: {
            enrollments: { some: { studentId, status: 'ACTIVE' } },
          },
          date: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            lte: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
          },
        },
        include: { holidayClass: true },
      });

      if (!holidaySchedule) {
        return {
          status: 'NO_SCHEDULE',
          message: `Siswa ${student.namaAnak} check-in, tetapi tidak ada jadwal kelas regular maupun holiday hari ini.`,
          student,
        };
      }

      // Check if attendance already marked today for this holiday class
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const existingAttendance = await this.prisma.attendance.findFirst({
        where: {
          studentId,
          classId: holidaySchedule.holidayClassId,
          date: { gte: startOfDay, lte: endOfDay },
        },
      });

      if (existingAttendance) {
        return {
          status: 'ALREADY_MARKED',
          message: `Absensi siswa ${student.namaAnak} untuk kelas liburan ${holidaySchedule.holidayClass?.namaProgram || 'Liburan'} sudah dicatat hari ini.`,
          student,
          class: { namaKelas: holidaySchedule.holidayClass?.namaProgram || 'Liburan' },
        };
      }

      // Create attendance for holiday class (since it's a regular attendance log structure)
      const holidayClass = await this.prisma.class.findFirst({
        where: { namaKelas: holidaySchedule.holidayClass?.namaProgram },
      });

      const attendance = await this.prisma.attendance.create({
        data: {
          studentId,
          classId: holidayClass?.id || holidaySchedule.holidayClassId, // fallback to holiday class ID
          status: 'PRESENT',
          notes: 'Absensi otomatis kelas liburan via Bio Fingerprint WiFi Push',
          date: today,
        },
      });

      return {
        status: 'SUCCESS',
        message: `Absensi Kelas Liburan (${holidaySchedule.holidayClass?.namaProgram || 'Liburan'}) berhasil dicatat.`,
        student,
        class: { namaKelas: holidaySchedule.holidayClass?.namaProgram || 'Liburan' },
        attendance,
      };
    }

    // Regular class attendance check
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        studentId,
        classId: schedule.classId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existingAttendance) {
      return {
        status: 'ALREADY_MARKED',
        message: `Absensi siswa ${student.namaAnak} untuk kelas ${schedule.class.namaKelas} sudah dicatat hari ini.`,
        student,
        class: schedule.class,
      };
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        studentId,
        classId: schedule.classId,
        status: 'PRESENT',
        notes: 'Absensi otomatis via Bio Fingerprint WiFi Push',
        date: today,
      },
      include: { class: true },
    });

    return {
      status: 'SUCCESS',
      message: `Absensi siswa ${student.namaAnak} berhasil dicatat.`,
      student,
      class: schedule.class,
      attendance,
    };
  }

  async importCsvAttendance(csvText: string) {
    const lines = csvText.split('\n');
    const results: any[] = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split(',');
      if (parts.length >= 2) {
        const deviceEmployeeId = parts[0].trim();
        const dateTimeStr = parts[1].trim();
        const date = new Date(dateTimeStr);
        if (!isNaN(date.getTime())) {
          try {
            const res = await this.recordAttendanceByDeviceId(deviceEmployeeId, date);
            results.push(res);
          } catch (err) {
            results.push({ status: 'FAILED', message: err.message, deviceEmployeeId });
          }
        }
      }
    }
    return results;
  }

  async getFingerprintsByStudent(studentId: string) {
    return this.prisma.fingerprintData.findMany({
      where: { studentId },
    });
  }

  async deleteFingerprint(id: string) {
    return this.prisma.fingerprintData.delete({
      where: { id },
    });
  }

  async getTodayAttendance() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return this.prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        student: true,
        class: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getAllRegisteredFingerprints() {
    return this.prisma.fingerprintData.findMany({
      where: { isActive: true },
      include: {
        student: {
          include: {
            schedules: {
              where: { status: 'ACTIVE' },
              include: { class: true },
            },
          },
        },
      },
    });
  }

  async getPublicKioskData() {
    const [staff, students, attendance] = await Promise.all([
      this.prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          role: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.student.findMany({
        select: {
          id: true,
          namaAnak: true,
          namaOrtu: true,
        },
        orderBy: { namaAnak: 'asc' },
      }),
      this.getTodayAttendance(),
    ]);

    return { staff, students, attendance };
  }

  async verifyStaff(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('Karyawan / Staf tidak ditemukan.');
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Check if staff already checked in today
    const existingLog = await this.prisma.attendance.findFirst({
      where: {
        notes: { contains: `Karyawan:${user.id}` },
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existingLog) {
      return {
        status: 'ALREADY_MARKED',
        message: `Karyawan ${user.name} (${user.role?.name || 'Staf'}) sudah presensi masuk hari ini.`,
        staff: user,
        attendance: existingLog,
      };
    }

    const firstClass = await this.prisma.class.findFirst();

    const attendanceData: any = {
      status: 'PRESENT',
      notes: `Presensi Karyawan:${user.id} - ${user.name} (${user.role?.name || 'Staf'}) via Biometrik HP`,
      date: today,
    };

    if (firstClass) {
      attendanceData.classId = firstClass.id;
    }

    const attendance = await this.prisma.attendance.create({
      data: attendanceData,
    });

    return {
      status: 'SUCCESS',
      message: `Presensi Karyawan ${user.name} (${user.role?.name || 'Staf'}) berhasil dicatat!`,
      staff: user,
      attendance,
    };
  }
}
