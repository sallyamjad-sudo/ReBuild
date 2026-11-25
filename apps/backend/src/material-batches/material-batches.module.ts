import { Module } from '@nestjs/common';
import { MaterialBatchesController } from './material-batches.controller.js';
import { MaterialBatchesService } from './material-batches.service.js';

@Module({
  controllers: [MaterialBatchesController],
  providers: [MaterialBatchesService]
})
export class MaterialBatchesModule {}
