import { Module } from '@nestjs/common';
import { MaterialMatchingController } from './material-matching.controller.js';
import { MaterialMatchingService } from './material-matching.service.js';

@Module({
  controllers: [MaterialMatchingController],
  providers: [MaterialMatchingService]
})
export class MaterialMatchingModule {}
