import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { Role } from '@/modules/users/entities/role.enum';
import type { AppAbility } from './casl-ability.factory';
import { CHECK_POLICIES_KEY } from './check-policies.decorator';
import { PoliciesGuard } from './policies.guard';

describe('PoliciesGuard', () => {
  const routeHandler = () => undefined;

  const createContext = (): ExecutionContext =>
    ({
      getHandler: () => routeHandler,
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: '1', email: 'jane@example.com', role: Role.Student } }),
      }),
    }) as unknown as ExecutionContext;

  const createGuard = (policyHandlers: Array<(ability: AppAbility) => boolean>) => {
    const reflector = { get: jest.fn().mockReturnValue(policyHandlers) } as unknown as Reflector;
    const caslAbilityFactory = { createForUser: jest.fn().mockReturnValue({}) };
    return new PoliciesGuard(reflector, caslAbilityFactory as never);
  };

  it('allows the request when every policy handler passes', () => {
    const guard = createGuard([() => true, () => true]);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('denies the request when any policy handler fails', () => {
    const guard = createGuard([() => true, () => false]);

    expect(guard.canActivate(createContext())).toBe(false);
  });

  it('allows the request when no policy handlers are declared', () => {
    const reflector = { get: jest.fn().mockReturnValue(undefined) } as unknown as Reflector;
    const caslAbilityFactory = { createForUser: jest.fn().mockReturnValue({}) };
    const guard = new PoliciesGuard(reflector, caslAbilityFactory as never);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('reads policy handlers using the CHECK_POLICIES_KEY metadata key', () => {
    const reflector = { get: jest.fn().mockReturnValue([]) } as unknown as Reflector;
    const caslAbilityFactory = { createForUser: jest.fn().mockReturnValue({}) };
    const guard = new PoliciesGuard(reflector, caslAbilityFactory as never);
    const context = createContext();

    guard.canActivate(context);

    expect(reflector.get).toHaveBeenCalledWith(CHECK_POLICIES_KEY, routeHandler);
  });

  it('builds the ability from the request user before checking policies', () => {
    const caslAbilityFactory = { createForUser: jest.fn().mockReturnValue({}) };
    const reflector = { get: jest.fn().mockReturnValue([() => true]) } as unknown as Reflector;
    const guard = new PoliciesGuard(reflector, caslAbilityFactory as never);

    guard.canActivate(createContext());

    expect(caslAbilityFactory.createForUser).toHaveBeenCalledWith({
      id: '1',
      email: 'jane@example.com',
      role: Role.Student,
    });
  });
});
