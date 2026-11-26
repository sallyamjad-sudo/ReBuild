
import { Test, TestingModule } from '@nestjs/testing';

import { MaterialRequestsController } from './material-requests.controller.js';
import { MaterialRequestsService } from './material-requests.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AuthorizationScopeGuard } from '../auth/guards/authorization-scope.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';

describe('MaterialRequestsController', () => {
  let controller: MaterialRequestsController;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [MaterialRequestsController],
        providers: [
          {
            provide: MaterialRequestsService,
            useValue: {},
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          canActivate: () => true,
        })
        .overrideGuard(AuthorizationScopeGuard)
        .useValue({
          canActivate: () => true,
        })
        .overrideGuard(PermissionsGuard)
        .useValue({
          canActivate: () => true,
        })
        .compile();

    controller = module.get<MaterialRequestsController>(
      MaterialRequestsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
