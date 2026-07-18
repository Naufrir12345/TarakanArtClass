import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { ClassesModule } from './classes/classes.module';
import { RegistrationModule } from './registration/registration.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ReportsModule } from './reports/reports.module';
import { PaymentsModule } from './payments/payments.module';
import { ExtraClassModule } from './extra-class/extra-class.module';
import { FinanceModule } from './finance/finance.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { InventoryModule } from './inventory/inventory.module';
import { ScheduleModule } from '@nestjs/schedule';

// New Modules
import { ActivityLogModule } from './activity-log/activity-log.module';
import { RolesModule } from './roles/roles.module';
import { RolesGuard } from './auth/roles.guard';
import { HolidayClassModule } from './holiday-class/holiday-class.module';
import { ExportModule } from './export/export.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ParentPortalModule } from './parent-portal/parent-portal.module';
import { FingerprintModule } from './fingerprint/fingerprint.module';
import { AccurateModule } from './accurate/accurate.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    StudentsModule,
    ClassesModule,
    RegistrationModule,
    SchedulesModule,
    ReportsModule,
    PaymentsModule,
    ExtraClassModule,
    FinanceModule,
    WhatsappModule,
    InventoryModule,
    ActivityLogModule,
    RolesModule,
    HolidayClassModule,
    ExportModule,
    InvoicesModule,
    AnalyticsModule,
    ParentPortalModule,
    FingerprintModule,
    AccurateModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule { }

