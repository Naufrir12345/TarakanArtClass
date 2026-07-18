import { IsNotEmpty, IsString, IsNumber, IsInt, IsOptional, Min } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  namaKelas: string;

  @IsString()
  @IsNotEmpty()
  tipe: string;

  @IsNumber()
  @Min(0)
  harga: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxCapacity?: number;

  @IsString()
  @IsOptional()
  kategori?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
