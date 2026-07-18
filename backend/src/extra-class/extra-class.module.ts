import { Module } from '@nestjs/common';
import { ExtraClassController } from './extra-class.controller';
import { ExtraClassService } from './extra-class.service';

@Module({
  controllers: [ExtraClassController],
  providers: [ExtraClassService],
  exports: [ExtraClassService],
})
export class ExtraClassModule {}
