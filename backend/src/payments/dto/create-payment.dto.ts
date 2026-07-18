import { IsNotEmpty, IsString, IsNumber, Min, IsEnum, IsOptional, IsDateString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // QRIS, CASH, TRANSFER

  @IsString()
  @IsNotEmpty()
  paymentType: string; // REGISTRATION, MONTHLY, EXTRA_CLASS

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
