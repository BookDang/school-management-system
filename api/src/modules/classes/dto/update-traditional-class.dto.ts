import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class UpdateTraditionalClassDto {
  @ApiPropertyOptional({ example: 'Grade 10A' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({ minimum: 1, example: 35 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  gradeLevel?: string;
}
