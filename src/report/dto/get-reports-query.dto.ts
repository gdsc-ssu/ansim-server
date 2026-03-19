import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { HazardType } from '../../common/enums/hazard.enum';

export class GetReportsQueryDto {
  @ApiProperty({ description: '위도', example: 37.5665 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  lat: number;

  @ApiProperty({ description: '경도', example: 126.978 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  lng: number;

  @ApiProperty({ description: '반경 (미터)', example: 1000 })
  @IsNumber()
  @Min(1)
  @Max(50000)
  @Type(() => Number)
  radius: number;

  @ApiPropertyOptional({ description: '위험 유형 필터', enum: HazardType })
  @IsOptional()
  @IsEnum(HazardType)
  hazardType?: HazardType;
}
