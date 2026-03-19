import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { HazardLevel, HazardType } from '../../common/enums/hazard.enum';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export class CreateMarkerImageDto {
  @IsUrl()
  url: string;

  @IsIn(ALLOWED_MIME_TYPES)
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  size: number;
}

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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => CreateMarkerImageDto)
  images?: CreateMarkerImageDto[];
}
