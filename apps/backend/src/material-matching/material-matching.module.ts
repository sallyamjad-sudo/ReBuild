
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { MaterialMatchingController } from './material-matching.controller.js';
import { MaterialMatchingService } from './material-matching.service.js';
import { MatchConfirmationService } from './match-confirmation.service.js';

@Module({
  imports: [AuthModule],
  controllers: [MaterialMatchingController],
  providers: [
    MaterialMatchingService,
    MatchConfirmationService,
  ],
})
export class MaterialMatchingModule {}
