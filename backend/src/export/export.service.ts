import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async generateReportHtml(reportId: string): Promise<string> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { student: true, grades: true },
    });

    if (!report) throw new Error('Rapor tidak ditemukan');

    const gradesRows = report.grades
      .map(
        (g) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${g.namaKelas}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${g.nilaiAngka}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${g.nilaiAbjad}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${g.keterangan || '-'}</td>
        </tr>`,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rapor - ${report.student.namaAnak}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; }
          .header h1 { color: #4f46e5; margin: 0; font-size: 24px; }
          .header p { color: #64748b; margin: 5px 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; }
          .info-item { padding: 8px 0; }
          .info-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
          .info-value { font-size: 16px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #4f46e5; color: white; padding: 10px 8px; text-align: left; }
          .summary { background: #f1f5f9; padding: 20px; border-radius: 8px; margin-top: 20px; }
          .summary h3 { margin: 0 0 10px 0; }
          .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PT. Manufindo Cipta Nusantara</h1>
          <p>Sistem Informasi Les Anak-Anak</p>
          <p style="font-size: 18px; font-weight: bold; margin-top: 10px;">RAPOR AKADEMIS</p>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Nama Siswa</div>
            <div class="info-value">${report.student.namaAnak}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Periode</div>
            <div class="info-value">${report.periode}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Orang Tua</div>
            <div class="info-value">${report.student.namaOrtu}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Credential Key</div>
            <div class="info-value" style="font-family: monospace; color: #4f46e5;">${report.credentialKey}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Mata Pelajaran</th>
              <th style="text-align: center;">Nilai Angka</th>
              <th style="text-align: center;">Nilai Huruf</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${gradesRows || '<tr><td colspan="4" style="padding: 8px; text-align: center;">Belum ada nilai</td></tr>'}
          </tbody>
        </table>

        <div class="summary">
          <h3>Ringkasan</h3>
          <p><strong>Rata-rata Nilai:</strong> ${report.nilaiRataRata ?? '-'} (${report.nilaiAbjad ?? '-'})</p>
          <p><strong>Catatan Guru:</strong> ${report.catatan || 'Tidak ada catatan'}</p>
        </div>

        <div class="footer">
          <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>Dokumen ini dihasilkan secara otomatis oleh Sistem Manufindo Les</p>
        </div>
      </body>
      </html>
    `;
  }

  async generateInvoiceHtml(invoiceId: string): Promise<string> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { student: true, items: true },
    });

    if (!invoice) throw new Error('Invoice tidak ditemukan');

    const itemsRows = invoice.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.description}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">Rp ${Number(item.amount).toLocaleString('id-ID')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">Rp ${(Number(item.amount) * item.quantity).toLocaleString('id-ID')}</td>
        </tr>`,
      )
      .join('');

    const statusColor = invoice.status === 'PAID' ? '#10b981' : invoice.status === 'OVERDUE' ? '#ef4444' : '#f59e0b';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; }
          .company { }
          .company h1 { color: #4f46e5; margin: 0; font-size: 22px; }
          .company p { color: #64748b; margin: 3px 0; font-size: 13px; }
          .invoice-info { text-align: right; }
          .invoice-info h2 { margin: 0; font-size: 28px; color: #1e293b; }
          .invoice-number { font-family: monospace; font-size: 16px; color: #4f46e5; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; color: white; font-size: 12px; font-weight: 700; text-transform: uppercase; }
          .bill-to { margin-bottom: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; }
          .bill-to h3 { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f1f5f9; padding: 12px 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
          .total-row { font-size: 18px; font-weight: 700; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">
            <h1>PT. Manufindo Cipta Nusantara</h1>
            <p>Sistem Les Anak-Anak</p>
          </div>
          <div class="invoice-info">
            <h2>INVOICE</h2>
            <p class="invoice-number">${invoice.invoiceNumber}</p>
            <p style="margin: 5px 0; color: #64748b;">Tanggal: ${new Date(invoice.createdAt).toLocaleDateString('id-ID')}</p>
            <p style="margin: 5px 0; color: #64748b;">Jatuh Tempo: ${new Date(invoice.dueDate).toLocaleDateString('id-ID')}</p>
            <span class="status-badge" style="background: ${statusColor};">${invoice.status}</span>
          </div>
        </div>

        <div class="bill-to">
          <h3>Tagihan Untuk</h3>
          <p style="font-weight: 600; font-size: 16px; margin: 0;">${invoice.student.namaOrtu}</p>
          <p style="margin: 3px 0; color: #64748b;">Siswa: ${invoice.student.namaAnak}</p>
          <p style="margin: 3px 0; color: #64748b;">Telp: ${invoice.student.noHpOrtu}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Deskripsi</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Harga</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
            <tr class="total-row">
              <td colspan="3" style="padding: 15px 10px; text-align: right; border-top: 2px solid #1e293b;">TOTAL</td>
              <td style="padding: 15px 10px; text-align: right; border-top: 2px solid #1e293b; color: #4f46e5;">Rp ${Number(invoice.totalAmount).toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>

        ${invoice.notes ? `<p style="margin-top: 20px; color: #64748b;"><strong>Catatan:</strong> ${invoice.notes}</p>` : ''}

        <div class="footer">
          <p>Terima kasih atas kepercayaan Anda</p>
          <p>Dokumen ini dihasilkan secara otomatis oleh Sistem Manufindo Les</p>
        </div>
      </body>
      </html>
    `;
  }

  async generateStudentsHtml(): Promise<string> {
    const students = await this.prisma.student.findMany({
      include: { enrollments: { include: { class: true } } },
      orderBy: { namaAnak: 'asc' },
    });

    const rows = students
      .map(
        (s) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${s.namaAnak}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${s.umur}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${s.namaOrtu}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${s.noHpOrtu}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${s.enrollments.map((e) => e.class.namaKelas).join(', ') || '-'}</td>
        </tr>`,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Daftar Siswa</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; }
          .header h1 { color: #4f46e5; margin: 0; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #4f46e5; color: white; padding: 10px 8px; text-align: left; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 30px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Daftar Siswa</h1>
          <p>PT. Manufindo Cipta Nusantara — Sistem Les Anak-Anak</p>
          <p>Total: ${students.length} siswa</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nama Anak</th>
              <th>Umur</th>
              <th>Orang Tua</th>
              <th>No. HP</th>
              <th>Kelas</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">
          <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </body>
      </html>
    `;
  }

  async generateFinanceHtml(month?: number, year?: number): Promise<string> {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const [incomes, expenses] = await Promise.all([
      this.prisma.income.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'desc' },
      }),
      this.prisma.expense.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'desc' },
      }),
    ]);

    const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const incomeRows = incomes
      .map(
        (i) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${new Date(i.date).toLocaleDateString('id-ID')}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${i.category}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${i.note || '-'}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; color: #10b981;">+Rp ${Number(i.amount).toLocaleString('id-ID')}</td>
        </tr>`,
      )
      .join('');

    const expenseRows = expenses
      .map(
        (e) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${new Date(e.date).toLocaleDateString('id-ID')}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${e.category}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${e.note || '-'}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; color: #ef4444;">-Rp ${Number(e.amount).toLocaleString('id-ID')}</td>
        </tr>`,
      )
      .join('');

    const monthName = new Date(y, m - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Laporan Keuangan - ${monthName}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; }
          .header h1 { color: #4f46e5; margin: 0; }
          .summary-cards { display: flex; gap: 20px; margin-bottom: 30px; }
          .card { flex: 1; padding: 20px; border-radius: 8px; text-align: center; }
          .card-income { background: #ecfdf5; color: #065f46; }
          .card-expense { background: #fef2f2; color: #991b1b; }
          .card-profit { background: #eff6ff; color: #1e40af; }
          .card h3 { margin: 0; font-size: 13px; text-transform: uppercase; opacity: 0.7; }
          .card p { margin: 5px 0 0; font-size: 22px; font-weight: 700; }
          h2 { color: #334155; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #f1f5f9; padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; }
          .footer { margin-top: 30px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Laporan Keuangan</h1>
          <p>PT. Manufindo Cipta Nusantara — ${monthName}</p>
        </div>

        <div class="summary-cards">
          <div class="card card-income">
            <h3>Total Pemasukan</h3>
            <p>Rp ${totalIncome.toLocaleString('id-ID')}</p>
          </div>
          <div class="card card-expense">
            <h3>Total Pengeluaran</h3>
            <p>Rp ${totalExpense.toLocaleString('id-ID')}</p>
          </div>
          <div class="card card-profit">
            <h3>Laba Bersih</h3>
            <p>Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}</p>
          </div>
        </div>

        <h2>Pemasukan (${incomes.length} transaksi)</h2>
        <table>
          <thead><tr><th>Tanggal</th><th>Kategori</th><th>Catatan</th><th style="text-align:right;">Jumlah</th></tr></thead>
          <tbody>${incomeRows || '<tr><td colspan="4" style="padding:8px;text-align:center;">Tidak ada pemasukan</td></tr>'}</tbody>
        </table>

        <h2>Pengeluaran (${expenses.length} transaksi)</h2>
        <table>
          <thead><tr><th>Tanggal</th><th>Kategori</th><th>Catatan</th><th style="text-align:right;">Jumlah</th></tr></thead>
          <tbody>${expenseRows || '<tr><td colspan="4" style="padding:8px;text-align:center;">Tidak ada pengeluaran</td></tr>'}</tbody>
        </table>

        <div class="footer">
          <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </body>
      </html>
    `;
  }
}
