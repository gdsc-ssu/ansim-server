import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Marker } from './entities/marker.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Marker])],
})
export class MarkerModule {}
