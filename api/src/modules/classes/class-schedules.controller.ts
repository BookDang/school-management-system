import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '@/modules/auth/strategies/jwt.strategy';
import { Action } from '@/modules/authorization/actions.enum';
import { CaslAbilityFactory } from '@/modules/authorization/casl-ability.factory';
import { CheckPolicies } from '@/modules/authorization/check-policies.decorator';
import { PoliciesGuard } from '@/modules/authorization/policies.guard';
import { ClassSchedulesService, ClassScheduleView } from './class-schedules.service';
import { CreateClassScheduleDto } from './dto/create-class-schedule.dto';
import { UpdateClassScheduleDto } from './dto/update-class-schedule.dto';
import { Classes } from './entities/classes.entity';

/** Schedules belong to the base Classes entity, not a specific type - one controller serves both
 * center and traditional classes rather than duplicating it under each type's controller. */
@ApiTags('Class Schedules')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
@Controller('classes/:classId/schedules')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class ClassSchedulesController {
  constructor(
    private readonly scheduleService: ClassSchedulesService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @ApiOperation({ summary: 'Add a schedule to a class' })
  @ApiOkResponse({ type: ClassScheduleView })
  @ApiForbiddenResponse({ description: 'Caller cannot manage this class.' })
  @ApiNotFoundResponse({ description: 'Class not found.' })
  @Post()
  @CheckPolicies((ability) => ability.can(Action.Update, Classes))
  async create(
    @Param('classId') classId: string,
    @Body() dto: CreateClassScheduleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    await this.assertCanManage(classId, currentUser);
    return this.scheduleService.create(classId, dto);
  }

  @ApiOperation({ summary: 'List all schedules for a class' })
  @ApiOkResponse({ type: ClassScheduleView, isArray: true })
  @ApiNotFoundResponse({ description: 'Class not found.' })
  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, Classes))
  async findAll(@Param('classId') classId: string) {
    const classEntity = await this.scheduleService.findClassEntityById(classId);
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    return this.scheduleService.findAllForClass(classId);
  }

  @ApiOperation({ summary: 'Get one schedule of a class' })
  @ApiOkResponse({ type: ClassScheduleView })
  @ApiNotFoundResponse({ description: 'Class or schedule not found.' })
  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, Classes))
  async findOne(@Param('classId') classId: string, @Param('id') id: string) {
    const schedule = await this.scheduleService.findOne(classId, id);
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }

  @ApiOperation({ summary: 'Update a schedule' })
  @ApiOkResponse({ type: ClassScheduleView })
  @ApiForbiddenResponse({ description: 'Caller cannot manage this class.' })
  @ApiNotFoundResponse({ description: 'Class or schedule not found.' })
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, Classes))
  async update(
    @Param('classId') classId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClassScheduleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    await this.assertCanManage(classId, currentUser);
    return this.scheduleService.update(classId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a schedule' })
  @ApiOkResponse({ description: 'Schedule deleted successfully.' })
  @ApiForbiddenResponse({ description: 'Caller cannot manage this class.' })
  @ApiNotFoundResponse({ description: 'Class or schedule not found.' })
  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, Classes))
  async remove(
    @Param('classId') classId: string,
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    await this.assertCanManage(classId, currentUser);
    await this.scheduleService.remove(classId, id);
  }

  /** Shared by create/update/remove: the class must exist, and the caller must be allowed to
   * update it - schedule mutation is authorized as if it were a class update, since CASL has no
   * separate subject for ClassSchedule. */
  private async assertCanManage(classId: string, currentUser: AuthenticatedUser): Promise<void> {
    const classEntity = await this.scheduleService.findClassEntityById(classId);
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    const ability = this.caslAbilityFactory.createForUser(currentUser);
    if (ability.cannot(Action.Update, classEntity)) {
      throw new ForbiddenException('You cannot manage this class');
    }
  }
}
