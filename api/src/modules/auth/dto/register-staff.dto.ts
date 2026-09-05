import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { Role } from '@/modules/users/entities/role.enum';

const STAFF_ROLES = [Role.Admin, Role.Teacher] as const;

export class RegisterStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(1)
  fullName: string;

  @IsIn(STAFF_ROLES)
  role: (typeof STAFF_ROLES)[number];
}
