import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // --- Items ---
  @Get()
  findAllItems() {
    return this.inventoryService.findAllItems();
  }

  @Get('summary')
  getSummary() {
    return this.inventoryService.getSummary();
  }

  @Get('sales')
  findAllSales() {
    return this.inventoryService.findAllSales();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOneItem(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.inventoryService.createItem({
      ...dto,
      hargaBeli: Number(dto.hargaBeli),
      hargaJual: Number(dto.hargaJual),
      stok: Number(dto.stok),
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.inventoryService.updateItem(id, {
      ...dto,
      ...(dto.hargaBeli !== undefined && { hargaBeli: Number(dto.hargaBeli) }),
      ...(dto.hargaJual !== undefined && { hargaJual: Number(dto.hargaJual) }),
      ...(dto.stok !== undefined && { stok: Number(dto.stok) }),
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventoryService.removeItem(id);
  }

  // --- Sales ---
  @Post('sales/record')
  recordSale(@Body() dto: { itemId: string; qty: number; pembeli?: string; catatan?: string }) {
    return this.inventoryService.recordSale({
      ...dto,
      qty: Number(dto.qty),
    });
  }
}
