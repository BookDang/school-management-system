import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../entities/role.enum';
import type { User } from '../entities/user.entity';

/** User fields safe to expose over the API — excludes the password hash and other internals. */
export class PublicUser {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ enum: Role })
  role: Role;
}

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
});
