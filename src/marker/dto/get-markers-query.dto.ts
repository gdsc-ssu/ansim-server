import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MarkerSource } from '../entities/marker.entity';

export class GetMarkersQueryDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  lng: number;

  @IsNumber()
  @Min(1)
  @Max(50000)
  @Type(() => Number)
  radius: number;

  @IsOptional()
  @IsString()
  hazardType?: string;

  @IsOptional()
  @IsEnum(MarkerSource)
  source?: MarkerSource;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  limit?: number;
}
