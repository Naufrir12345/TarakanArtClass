import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // added for HTTP calls
import { ConfigModule } from '@nestjs/config'; // added for env config
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [HttpModule, ConfigModule], // expose HttpService & ConfigService
  controllers: [WhatsappController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
