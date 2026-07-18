import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ExtraClassService } from './extra-class.service';
import { CreateExtraClassDto } from './dto/create-extra-class.dto';
import { ExtraClassStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('extra-classes')
export class ExtraClassController {
  constructor(private extraClassService: ExtraClassService) { }

  @Get()
  findAll() {
    return this.extraClassService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.extraClassService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateExtraClassDto) {
    return this.extraClassService.create(dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ExtraClassStatus,
  ) {
    return this.extraClassService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.extraClassService.remove(id);
  }
}
