import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { HazardLevel } from '../entities/report.entity';

export class UpdateReportDto {
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
