import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsMilitaryTime,
  IsOptional,
} from 'class-validator';
import { DayOfWeek } from '../entities/day-of-week.enum';

export class UpdateClassScheduleDto {
  @ApiPropertyOptional({ format: 'date', example: '2026-09-01', description: 'Course start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ format: 'date', example: '2026-12-15', description: 'Course end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: DayOfWeek,
    isArray: true,
    example: [DayOfWeek.Monday, DayOfWeek.Wednesday],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(DayOfWeek, { each: true })
  daysOfWeek?: DayOfWeek[];

  @ApiPropertyOptional({ example: '18:00', description: 'Session start time, 24-hour HH:mm' })
  @IsOptional()
  @IsMilitaryTime()
  startTime?: string;

  @ApiPropertyOptional({ example: '20:00', description: 'Session end time, 24-hour HH:mm' })
  @IsOptional()
  @IsMilitaryTime()
  endTime?: string;
}
