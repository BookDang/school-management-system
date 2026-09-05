import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '@/modules/auth/strategies/jwt.strategy';

export const getCurrentUserFromContext = (
  _data: unknown,
  ctx: ExecutionContext,
): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
  return request.user;
};

export const CurrentUser = createParamDecorator(getCurrentUserFromContext);
