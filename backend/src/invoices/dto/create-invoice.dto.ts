import { IsString, IsNotEmpty, IsDateString, IsOptional, IsArray, ValidateNested, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

class InvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsNumber()
  @IsOptional()
  quantity?: number;
}

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}
