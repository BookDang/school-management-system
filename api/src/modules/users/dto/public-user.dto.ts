import type { Role } from '../entities/role.enum';
import type { User } from '../entities/user.entity';

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
});
