import { IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class UpdateCenterClassDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  subject?: string;
}
