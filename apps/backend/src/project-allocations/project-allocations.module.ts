import { Module } from '@nestjs/common';
import { ProjectAllocationsController } from './project-allocations.controller.js';
import { ProjectAllocationsService } from './project-allocations.service.js';

@Module({
  controllers: [ProjectAllocationsController],
  providers: [ProjectAllocationsService]
})
export class ProjectAllocationsModule {}
