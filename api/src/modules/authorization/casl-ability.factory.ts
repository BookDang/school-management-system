import {
  AbilityBuilder,
  createMongoAbility,
  type ExtractSubjectType,
  type InferSubjects,
  type MongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '@/modules/auth/strategies/jwt.strategy';
import { Classes } from '@/modules/classes/entities/classes.entity';
import { Role } from '@/modules/users/entities/role.enum';
import { User } from '@/modules/users/entities/user.entity';
import { Action } from './actions.enum';

export type Subjects = InferSubjects<typeof User | typeof Classes> | 'all';
export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: AuthenticatedUser): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.role === Role.Admin) {
      can(Action.Manage, 'all');
    } else if (user.role === Role.Teacher) {
      can(Action.Read, User);
      can(Action.Read, Classes);
      can(Action.Update, Classes, { teacherId: user.id });
    } else {
      can(Action.Read, User, { id: user.id });
      can(Action.Read, Classes);
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
