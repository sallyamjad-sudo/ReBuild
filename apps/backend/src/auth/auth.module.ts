
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { AuthorizationScopeService } from './scopes/authorization-scope.service.js';
import { AuthorizationScopeGuard } from './guards/authorization-scope.guard.js';

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
