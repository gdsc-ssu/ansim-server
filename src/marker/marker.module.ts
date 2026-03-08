import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from '../report/entities/report.entity';
import { Marker } from './entities/marker.entity';
import { MarkerController } from './marker.controller';
import { MarkerService } from './marker.service';

@Module({
  imports: [TypeOrmModule.forFeature([Marker, Report])],
  controllers: [MarkerController],
  providers: [MarkerService],
})
export class MarkerModule {}
