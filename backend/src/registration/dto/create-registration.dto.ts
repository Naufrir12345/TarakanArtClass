import { IsNotEmpty, IsString, IsInt, IsEmail, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleItemDto {
  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsInt()
  @Min(0)
  dayOfWeek: number;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;
}

export class CreateRegistrationDto {
  @IsString()
  @IsNotEmpty()
  namaAnak: string;

  @IsInt()
  @Min(1)
  umur: number;

  @IsString()
  @IsNotEmpty()
  namaOrtu: string;

  @IsString()
  @IsNotEmpty()
  noHpOrtu: string;

  @IsEmail()
  emailOrtu: string;

  @IsString()
  @IsOptional()
  instagram?: string;

  @IsString()
  @IsOptional()
  alamat?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemDto)
  schedules: ScheduleItemDto[];
}
