import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class AddGradeDto {
  @IsString()
  @IsNotEmpty()
  namaKelas: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  nilaiAngka: number;

  @IsString()
  @IsOptional()
  keterangan?: string;
}
