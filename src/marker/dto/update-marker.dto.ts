import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { HazardLevel } from '../../report/entities/report.entity';

export class UpdateMarkerDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  hazardType?: string;

  @IsOptional()
  @IsEnum(HazardLevel)
  hazardLevel?: HazardLevel;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;
}
