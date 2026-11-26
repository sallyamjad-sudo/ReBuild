
import {
  ExecutionContext,
  Module,
} from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { AuthorizationScopeGuard } from './guards/authorization-scope.guard.js';

import { AuthorizationScopeService } from './scopes/authorization-scope.service.js';

import { IS_PUBLIC_KEY } from './permissions/public.decorator.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtAuthGuard,
    AuthorizationScopeGuard,
    PermissionsGuard,
    AuthorizationScopeService,

    {
      provide: APP_GUARD,
      inject: [JwtAuthGuard, Reflector],
      useFactory: (
        jwtGuard: JwtAuthGuard,
        reflector: Reflector,
      ) => ({
        canActivate: (context: ExecutionContext) => {
          const isPublic =
            reflector.getAllAndOverride<boolean>(
              IS_PUBLIC_KEY,
              [
                context.getHandler(),
                context.getClass(),
              ],
            );

          if (isPublic) {
            return true;
          }

          return jwtGuard.canActivate(context);
        },
      }),
    },
  ],

  exports: [
    JwtModule,
    AuthService,
    JwtAuthGuard,
    AuthorizationScopeGuard,
    PermissionsGuard,
    AuthorizationScopeService,
  ],
})
export class AuthModule {}
