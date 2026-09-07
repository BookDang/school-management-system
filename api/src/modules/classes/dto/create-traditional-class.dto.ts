import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateTraditionalClassDto {
  @ApiProperty({ example: 'Grade 10A' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  teacherId: string;

  @ApiProperty({ minimum: 1, example: 35 })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({ example: '10' })
  @IsString()
  @MinLength(1)
  gradeLevel: string;
}
