import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { ReminderService } from './reminder.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 15000,    // 15 detik timeout default
      maxRedirects: 3,
    }),
    ConfigModule,
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService, ReminderService],
  exports: [WhatsappService, ReminderService],
})
export class WhatsappModule {}
