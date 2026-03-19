import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { HazardLevel, HazardType } from '../../common/enums/hazard.enum';

export class UpdateMarkerDto {
  @IsOptional()
  @IsEnum(HazardType)
  hazardType?: HazardType;

  @IsOptional()
  @IsEnum(HazardLevel)
  hazardLevel?: HazardLevel;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;
}
