import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { HazardLevel, HazardType } from '../../common/enums/hazard.enum';

export class UpdateReportDto {
  @ApiPropertyOptional({ description: '위험 유형', enum: HazardType })
  @IsOptional()
  @IsEnum(HazardType)
  hazardType?: HazardType;

  @ApiPropertyOptional({ description: '위험 등급', enum: HazardLevel })
  @IsOptional()
  @IsEnum(HazardLevel)
  hazardLevel?: HazardLevel;

  @ApiPropertyOptional({
    description: '신고 내용',
    example: '건물에서 연기가 납니다.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;
}
