import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './infrastructure/database/data-source';
import { AppController } from './modules/app/app.controller';
import { AppService } from './modules/app/app.service';
import { FeaturesModule } from './modules/features.module';

const { entities: _entities, ...runtimeDataSourceOptions } = dataSourceOptions;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...runtimeDataSourceOptions,
        autoLoadEntities: true,
        migrationsRun: true,
      }),
    }),
    FeaturesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
