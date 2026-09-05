import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from '@/modules/auth/strategies/jwt.strategy';
import { CaslAbilityFactory } from './casl-ability.factory';
import { CHECK_POLICIES_KEY, type PolicyHandlerCallback } from './check-policies.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const policyHandlers =
      this.reflector.get<PolicyHandlerCallback[]>(CHECK_POLICIES_KEY, context.getHandler()) ?? [];

    const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    const ability = this.caslAbilityFactory.createForUser(request.user);

    return policyHandlers.every((handler) => handler(ability));
  }
}
