import { Module } from '@nestjs/common';
import { MaterialRequestsController } from './material-requests.controller.js';
import { MaterialRequestsService } from './material-requests.service.js';

@Module({
  controllers: [MaterialRequestsController],
  providers: [MaterialRequestsService]
})
export class MaterialRequestsModule {}
