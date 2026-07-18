import { IsNotEmpty, IsString, IsInt, IsEmail, IsOptional, Min } from 'class-validator';

export class CreateStudentDto {
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
}
