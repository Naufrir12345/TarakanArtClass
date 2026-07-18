import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateExtraClassDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
