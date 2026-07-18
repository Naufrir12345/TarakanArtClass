import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('classes') // Menggunakan prefix 'classes' (api/classes sudah dihandle main.ts)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) { }

  // AKSES PUBLIK: Digunakan oleh frontend untuk mengisi dropdown registrasi
  @Get()
  findAll() {
    return this.classesService.findAll();
  }

  // AKSES PUBLIK: Mengambil detail satu kelas
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  // HANYA ADMIN: Memerlukan token JWT
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateClassDto) {
    return this.classesService.create(dto);
  }

  // HANYA ADMIN: Memerlukan token JWT
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.classesService.update(id, dto);
  }

  // HANYA ADMIN: Memerlukan token JWT
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }
}