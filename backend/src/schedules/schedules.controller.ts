import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { CreateReplacementDto } from './dto/create-replacement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('schedules')
export class SchedulesController {
  constructor(private schedulesService: SchedulesService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.schedulesService.findAll(month, year);
  }

  @UseGuards(JwtAuthGuard)
  @Post('copy-month')
  copyMonth(
    @Body('sourceMonth') sourceMonth: number,
    @Body('sourceYear') sourceYear: number,
    @Body('targetMonth') targetMonth: number,
    @Body('targetYear') targetYear: number,
  ) {
    return this.schedulesService.copyMonth(sourceMonth, sourceYear, targetMonth, targetYear);
  }

  @UseGuards(JwtAuthGuard)
  @Get('replacements')
  findAllReplacements() {
    return this.schedulesService.findAllReplacements();
  }

  @UseGuards(JwtAuthGuard)
  @Get('recommendations/:scheduleId')
  findRecommendations(@Param('scheduleId') scheduleId: string) {
    return this.schedulesService.findRecommendations(scheduleId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateScheduleDto) {
    return this.schedulesService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateScheduleDto>) {
    return this.schedulesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }

  // --- REPLACEMENT ENDPOINTS ---
  @UseGuards(JwtAuthGuard)
  @Post('replacements')
  createReplacement(@Body() dto: CreateReplacementDto) {
    return this.schedulesService.createReplacement(dto);
  }

  // Public/Parent endpoint to respond to replacement proposals
  @Post('replacements/:id/respond')
  respondToReplacement(
    @Param('id') id: string,
    @Body('response') response: 'ACCEPTED' | 'REJECTED',
  ) {
    return this.schedulesService.respondToReplacement(id, response);
  }
}
