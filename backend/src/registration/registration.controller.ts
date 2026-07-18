import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('registration')
export class RegistrationController {
  constructor(private registrationService: RegistrationService) { }

  @Post()
  register(@Body() dto: CreateRegistrationDto) {
    return this.registrationService.register(dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.registrationService.findAllRegistrations({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }
}
