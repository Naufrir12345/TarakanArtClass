import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.invoicesService.findAll({ status, studentId });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.invoicesService.update(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/pay')
  getPaymentLink(@Param('id') id: string) {
    return this.invoicesService.getPaymentLink(id);
  }

  // Midtrans webhook (public endpoint)
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() body: any) {
    return this.invoicesService.handleWebhook(body);
  }
}
