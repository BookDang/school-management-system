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
import { CenterClassesService } from './center-classes.service';
import { CreateCenterClassDto } from './dto/create-center-class.dto';
import { UpdateCenterClassDto } from './dto/update-center-class.dto';
import { Classes } from './entities/classes.entity';

@Controller('center-classes')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class CenterClassesController {
  constructor(
    private readonly centerClassesService: CenterClassesService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, Classes))
  create(@Body() dto: CreateCenterClassDto) {
    return this.centerClassesService.create(dto);
  }

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, Classes))
  findAll() {
    return this.centerClassesService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, Classes))
  async findOne(@Param('id') id: string) {
    const view = await this.centerClassesService.findById(id);
    if (!view) {
      throw new NotFoundException('Class not found');
    }

    return view;
  }

  // See TraditionalClassesController.update for why this checks the raw entity directly instead
  // of CASL's `subject()` helper.
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, Classes))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCenterClassDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const classEntity = await this.centerClassesService.findEntityById(id);
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    const ability = this.caslAbilityFactory.createForUser(currentUser);
    if (ability.cannot(Action.Update, classEntity)) {
      throw new ForbiddenException('You cannot update this class');
    }

    return this.centerClassesService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, Classes))
  async remove(@Param('id') id: string) {
    await this.centerClassesService.remove(id);
  }
}
