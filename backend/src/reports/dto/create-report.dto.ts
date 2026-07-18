import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  periode: string; // e.g. "2026-Semester-1"

  @IsString()
  @IsOptional()
  catatan?: string;
}
