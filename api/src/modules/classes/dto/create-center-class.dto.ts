import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateCenterClassDto {
  @ApiProperty({ example: 'IELTS Advanced' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  teacherId: string;

  @ApiProperty({ minimum: 1, example: 20 })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({ example: 'English' })
  @IsString()
  @MinLength(1)
  subject: string;
}
