import { Module } from '@nestjs/common';
import { MaterialRequestsController } from './material-requests.controller.js';
import { MaterialRequestsService } from './material-requests.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [MaterialRequestsController],
  providers: [MaterialRequestsService],
})
export class MaterialRequestsModule {}
