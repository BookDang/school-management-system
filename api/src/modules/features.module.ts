import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ClassesModule } from './classes/classes.module';
import { UsersModule } from './users/users.module';

/**
 * Aggregates every feature module so app.module.ts only wires bootstrap concerns (config,
 * TypeORM) plus this one import - add new feature modules here, not directly to AppModule.
 */
@Module({
  imports: [UsersModule, AuthModule, ClassesModule],
})
export class FeaturesModule {}
