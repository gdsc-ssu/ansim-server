import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafetyMungoReport } from './entities/safety-mungo-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SafetyMungoReport])],
})
export class SafetyMungoReportModule {}
