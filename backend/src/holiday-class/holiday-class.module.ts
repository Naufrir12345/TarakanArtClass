import { Module } from '@nestjs/common';
import { HolidayClassController } from './holiday-class.controller';
import { HolidayClassService } from './holiday-class.service';

@Module({
  controllers: [HolidayClassController],
  providers: [HolidayClassService],
  exports: [HolidayClassService],
})
export class HolidayClassModule {}
