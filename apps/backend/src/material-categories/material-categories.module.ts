import { Module } from '@nestjs/common';
import { MaterialCategoriesController } from './material-categories.controller.js';
import { MaterialCategoriesService } from './material-categories.service.js';

@Module({
  controllers: [MaterialCategoriesController],
  providers: [MaterialCategoriesService]
})
export class MaterialCategoriesModule {}
