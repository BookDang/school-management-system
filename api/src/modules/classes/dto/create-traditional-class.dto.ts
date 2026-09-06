import { IsInt, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateTraditionalClassDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsUUID()
  teacherId: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsString()
  @MinLength(1)
  gradeLevel: string;
}
