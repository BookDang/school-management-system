import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { Role } from '@/modules/users/entities/role.enum';

const STAFF_ROLES = [Role.Admin, Role.Teacher] as const;

export class RegisterStaffDto {
  @ApiProperty({ format: 'email', example: 'teacher@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8, example: 'p@ssw0rd123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(1)
  fullName: string;

  @ApiProperty({ enum: STAFF_ROLES })
  @IsIn(STAFF_ROLES)
  role: (typeof STAFF_ROLES)[number];
}
