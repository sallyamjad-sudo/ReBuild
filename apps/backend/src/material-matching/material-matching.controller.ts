
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { MaterialMatchingService } from './material-matching.service.js';
import { MatchConfirmationService } from './match-confirmation.service.js';

@Controller('material-matching')
export class MaterialMatchingController {
  constructor(
    private readonly matchingService: MaterialMatchingService,
    private readonly confirmationService: MatchConfirmationService,
  ) {}

  @Post('request-items/:requestItemId/run')
  runMatching(
    @Param('requestItemId', ParseUUIDPipe) requestItemId: string,
  ) {
    return this.matchingService.runMatching(requestItemId);
  }

  @Post('results/:id/confirm')
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { confirmedById: string },
  ) {
    return this.confirmationService.confirm(id, body);
  }

  @Get('request-items/:requestItemId/results')
  findAll(
    @Param('requestItemId', ParseUUIDPipe) requestItemId: string,
  ) {
    return this.matchingService.findAll(requestItemId);
  }

  @Get('results/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.matchingService.findOne(id);
  }
}
