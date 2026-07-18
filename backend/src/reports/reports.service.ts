import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { AddGradeDto } from './dto/add-grade.dto';
import * as crypto from 'crypto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.report.findMany({
      include: {
        student: true,
        grades: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        student: true,
        grades: true,
      },
    });
    if (!report) {
      throw new NotFoundException('Rapor tidak ditemukan');
    }
    return report;
  }

  async create(dto: CreateReportDto) {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Siswa tidak ditemukan');

    // Generate unique credential key (like a short code)
    const credentialKey = crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. "A7B8F9C1"

    return this.prisma.report.create({
      data: {
        studentId: dto.studentId,
        periode: dto.periode,
        catatan: dto.catatan,
        credentialKey,
      },
      include: {
        student: true,
        grades: true,
      },
    });
  }

  async addGrade(id: string, dto: AddGradeDto) {
    const report = await this.findOne(id);

    const nilaiAbjad = this.calculateAlphabetGrade(dto.nilaiAngka);

    await this.prisma.reportGrade.create({
      data: {
        reportId: id,
        namaKelas: dto.namaKelas,
        nilaiAngka: dto.nilaiAngka,
        nilaiAbjad,
        keterangan: dto.keterangan,
      },
    });

    return this.recalculateReportAverage(id);
  }

  async removeGrade(gradeId: string) {
    const grade = await this.prisma.reportGrade.findUnique({ where: { id: gradeId } });
    if (!grade) throw new NotFoundException('Nilai tidak ditemukan');

    await this.prisma.reportGrade.delete({ where: { id: gradeId } });
    return this.recalculateReportAverage(grade.reportId);
  }

  async verifyCredential(credentialKey: string) {
    const report = await this.prisma.report.findUnique({
      where: { credentialKey },
      include: {
        student: true,
        grades: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Credential key rapor tidak valid');
    }

    return report;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.report.delete({ where: { id } });
  }

  private calculateAlphabetGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'E';
  }

  private async recalculateReportAverage(reportId: string) {
    const grades = await this.prisma.reportGrade.findMany({
      where: { reportId },
    });

    if (grades.length === 0) {
      return this.prisma.report.update({
        where: { id: reportId },
        data: {
          nilaiRataRata: null,
          nilaiAbjad: null,
        },
        include: {
          student: true,
          grades: true,
        },
      });
    }

    const sum = grades.reduce((acc, curr) => acc + curr.nilaiAngka, 0);
    const average = parseFloat((sum / grades.length).toFixed(2));
    const averageAlphabet = this.calculateAlphabetGrade(average);

    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        nilaiRataRata: average,
        nilaiAbjad: averageAlphabet,
      },
      include: {
        student: true,
        grades: true,
      },
    });
  }
}
