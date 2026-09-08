import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsDateString, IsEnum, IsMilitaryTime } from 'class-validator';
import { DayOfWeek } from '../entities/day-of-week.enum';

export class CreateClassScheduleDto {
  @ApiProperty({ format: 'date', example: '2026-09-01', description: 'Course start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ format: 'date', example: '2026-12-15', description: 'Course end date' })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    enum: DayOfWeek,
    isArray: true,
    example: [DayOfWeek.Monday, DayOfWeek.Wednesday],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(DayOfWeek, { each: true })
  daysOfWeek: DayOfWeek[];

  @ApiProperty({ example: '18:00', description: 'Session start time, 24-hour HH:mm' })
  @IsMilitaryTime()
  startTime: string;

  @ApiProperty({ example: '20:00', description: 'Session end time, 24-hour HH:mm' })
  @IsMilitaryTime()
  endTime: string;
}
