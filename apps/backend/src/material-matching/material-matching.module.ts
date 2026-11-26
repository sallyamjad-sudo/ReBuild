
import { Module } from '@nestjs/common';
import { MaterialMatchingController } from './material-matching.controller.js';
import { MaterialMatchingService } from './material-matching.service.js';
import { MatchConfirmationService } from './match-confirmation.service.js';

@Module({
  controllers: [MaterialMatchingController],
  providers: [
    MaterialMatchingService,
    MatchConfirmationService,
  ],
})
export class MaterialMatchingModule {}
