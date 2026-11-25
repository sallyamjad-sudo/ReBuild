
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { MaterialMatchingService } from './material-matching.service.js';

@Controller('material-matching')
export class MaterialMatchingController {
  constructor(
    private readonly matchingService: MaterialMatchingService,
  ) {}

  @Post('request-items/:requestItemId/run')
  runMatching(
    @Param('requestItemId', ParseUUIDPipe) requestItemId: string,
  ) {
    return this.matchingService.runMatching(requestItemId);
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
