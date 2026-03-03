import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { databaseConfig } from './database.config';
import { UserModule } from './user/user.module';
import { ImageModule } from './image/image.module';
import { ReportModule } from './report/report.module';
import { SafetyMungoReportModule } from './safety-mungo-report/safety-mungo-report.module';
import { MarkerModule } from './marker/marker.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      ...databaseConfig,
      autoLoadEntities: true,
    }),
    SchedulerModule,
    UserModule,
    AuthModule,
    ImageModule,
    ReportModule,
    SafetyMungoReportModule,
    MarkerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
