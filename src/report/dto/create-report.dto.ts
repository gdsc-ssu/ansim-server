import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { HazardLevel } from '../entities/report.entity';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  hazardType: string;

  @IsEnum(HazardLevel)
  hazardLevel: HazardLevel;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsObject()
  aiRawResult?: object;
}
