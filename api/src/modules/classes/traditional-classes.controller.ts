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
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '@/modules/auth/strategies/jwt.strategy';
import { Action } from '@/modules/authorization/actions.enum';
import { CaslAbilityFactory } from '@/modules/authorization/casl-ability.factory';
import { CheckPolicies } from '@/modules/authorization/check-policies.decorator';
import { PoliciesGuard } from '@/modules/authorization/policies.guard';
import { CreateTraditionalClassDto } from './dto/create-traditional-class.dto';
import { UpdateTraditionalClassDto } from './dto/update-traditional-class.dto';
import { Classes } from './entities/classes.entity';
import { TraditionalClassesService } from './traditional-classes.service';

@Controller('traditional-classes')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class TraditionalClassesController {
  constructor(
    private readonly traditionalClassesService: TraditionalClassesService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, Classes))
  create(@Body() dto: CreateTraditionalClassDto) {
    return this.traditionalClassesService.create(dto);
  }

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, Classes))
  findAll() {
    return this.traditionalClassesService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, Classes))
  async findOne(@Param('id') id: string) {
    const view = await this.traditionalClassesService.findById(id);
    if (!view) {
      throw new NotFoundException('Class not found');
    }

    return view;
  }

  // Guarded twice: @CheckPolicies rejects roles with no Update rule on Classes at all, then the
  // instance-scoped check below enforces a teacher can only update their own class - a bare-type
  // check can't see teacherId until the record is loaded. Checked against the raw base-table
  // entity directly (not CASL's `subject()` helper): CaslAbilityFactory's `detectSubjectType`
  // resolves a checked instance by its constructor reference, the same reference
  // `can(Action.Update, Classes, {...})` registered the rule under - `subject()` would tag the
  // object with a *string* instead, which doesn't match that reference.
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, Classes))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTraditionalClassDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const classEntity = await this.traditionalClassesService.findEntityById(id);
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    const ability = this.caslAbilityFactory.createForUser(currentUser);
    if (ability.cannot(Action.Update, classEntity)) {
      throw new ForbiddenException('You cannot update this class');
    }

    return this.traditionalClassesService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, Classes))
  async remove(@Param('id') id: string) {
    await this.traditionalClassesService.remove(id);
  }
}
