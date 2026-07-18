import { Module } from '@nestjs/common';
import { ParentPortalController } from './parent-portal.controller';
import { ParentPortalService } from './parent-portal.service';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule to get JwtService

@Module({
  imports: [AuthModule],
  controllers: [ParentPortalController],
  providers: [ParentPortalService],
  exports: [ParentPortalService],
})
export class ParentPortalModule {}
