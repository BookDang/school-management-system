import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizationModule } from '@/modules/authorization/authorization.module';
import { CenterClassesController } from './center-classes.controller';
import { CenterClassesService } from './center-classes.service';
import { CenterClassDetail } from './entities/center-class-detail.entity';
import { Classes } from './entities/classes.entity';
import { TraditionalClassDetail } from './entities/traditional-class-detail.entity';
import { TraditionalClassesController } from './traditional-classes.controller';
import { TraditionalClassesService } from './traditional-classes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Classes, TraditionalClassDetail, CenterClassDetail]),
    AuthorizationModule,
  ],
  controllers: [TraditionalClassesController, CenterClassesController],
  providers: [TraditionalClassesService, CenterClassesService],
  exports: [TraditionalClassesService, CenterClassesService],
})
export class ClassesModule {}
