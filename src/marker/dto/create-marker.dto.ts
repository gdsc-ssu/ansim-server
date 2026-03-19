import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { HazardLevel, HazardType } from '../../common/enums/hazard.enum';

export class CreateMarkerDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsEnum(HazardType)
  hazardType: HazardType;

  @IsEnum(HazardLevel)
  hazardLevel: HazardLevel;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsObject()
  aiRawResult?: object;
}
