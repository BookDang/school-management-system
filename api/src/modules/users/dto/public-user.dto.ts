import type { User } from '../entities/user.entity';

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
}

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
});
