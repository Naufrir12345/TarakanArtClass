import { Controller, Get, Param, Query, Header, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('report/:id/pdf')
  @Header('Content-Type', 'text/html')
  async exportReport(@Param('id') id: string) {
    const html = await this.exportService.generateReportHtml(id);
    return this.appendPrintScript(html);
  }

  @UseGuards(JwtAuthGuard)
  @Get('invoice/:id/pdf')
  @Header('Content-Type', 'text/html')
  async exportInvoice(@Param('id') id: string) {
    const html = await this.exportService.generateInvoiceHtml(id);
    return this.appendPrintScript(html);
  }

  @UseGuards(JwtAuthGuard)
  @Get('students/pdf')
  @Header('Content-Type', 'text/html')
  async exportStudents() {
    const html = await this.exportService.generateStudentsHtml();
    return this.appendPrintScript(html);
  }

  @UseGuards(JwtAuthGuard)
  @Get('finance/pdf')
  @Header('Content-Type', 'text/html')
  async exportFinance(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const m = month ? parseInt(month, 10) : undefined;
    const y = year ? parseInt(year, 10) : undefined;
    const html = await this.exportService.generateFinanceHtml(m, y);
    return this.appendPrintScript(html);
  }

  private appendPrintScript(html: string): string {
    // Append window.print() and auto-close script so it triggers print dialog automatically
    return html.replace(
      '</body>',
      `<script>
        window.onload = function() {
          window.print();
        }
      </script>
      </body>`
    );
  }
}
