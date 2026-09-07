import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ format: 'email', example: 'student@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8, example: 'p@ssw0rd123' })
  @IsString()
  @MinLength(8)
  password: string;
}
