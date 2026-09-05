import type { AuthenticatedUser } from '@/modules/auth/strategies/jwt.strategy';
import { Role } from '@/modules/users/entities/role.enum';
import { User } from '@/modules/users/entities/user.entity';
import { Action } from './actions.enum';
import { CaslAbilityFactory } from './casl-ability.factory';

describe('CaslAbilityFactory', () => {
  const factory = new CaslAbilityFactory();

  const asUser = (user: Partial<User>): User => Object.assign(new User(), user);

  it('lets an admin manage everything', () => {
    const admin: AuthenticatedUser = { id: '1', email: 'admin@example.com', role: Role.Admin };
    const ability = factory.createForUser(admin);

    expect(ability.can(Action.Manage, 'all')).toBe(true);
    expect(ability.can(Action.Delete, asUser({ id: '2' }))).toBe(true);
  });

  it('lets a teacher read any user but not manage them', () => {
    const teacher: AuthenticatedUser = {
      id: '1',
      email: 'teacher@example.com',
      role: Role.Teacher,
    };
    const ability = factory.createForUser(teacher);

    expect(ability.can(Action.Read, asUser({ id: '2' }))).toBe(true);
    expect(ability.can(Action.Manage, 'all')).toBe(false);
    expect(ability.can(Action.Delete, asUser({ id: '2' }))).toBe(false);
  });

  it('lets a student read only their own record', () => {
    const student: AuthenticatedUser = {
      id: '1',
      email: 'student@example.com',
      role: Role.Student,
    };
    const ability = factory.createForUser(student);

    expect(ability.can(Action.Read, asUser({ id: '1' }))).toBe(true);
    expect(ability.can(Action.Read, asUser({ id: '2' }))).toBe(false);
    expect(ability.can(Action.Manage, 'all')).toBe(false);
  });
});
