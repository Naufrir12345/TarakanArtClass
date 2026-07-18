import { IsNotEmpty, IsString, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';

export class CreateReplacementDto {
  @IsString()
  @IsNotEmpty()
  scheduleId: string;

  @IsDateString()
  originalDate: string;

  @IsDateString()
  @IsOptional()
  replacementDate?: string;

  @IsInt()
  @Min(0)
  @Max(6)
  @IsOptional()
  newDayOfWeek?: number;

  @IsString()
  @IsOptional()
  newStartTime?: string;

  @IsString()
  @IsOptional()
  newEndTime?: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
