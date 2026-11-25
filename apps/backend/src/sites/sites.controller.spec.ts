import { SitesService } from './sites.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { SitesController } from './sites.controller.js';

describe('SitesController', () => {
  let controller: SitesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SitesController],
      providers: [
        { provide: SitesService, useValue: {} },
      ],
    }).compile();

    controller = module.get<SitesController>(SitesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
