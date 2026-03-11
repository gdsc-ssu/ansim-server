import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { HazardLevel } from '../entities/report.entity';

export class CreateReportDto {
  @ApiProperty({ description: '위험 유형', example: '화재' })
  @IsString()
  @IsNotEmpty()
  hazardType: string;

  @ApiProperty({ description: '위험 등급', enum: HazardLevel })
  @IsEnum(HazardLevel)
  hazardLevel: HazardLevel;

  @ApiProperty({ description: '신고 내용', example: '건물에서 연기가 납니다.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'AI 분석 원본 결과' })
  @IsOptional()
  @IsObject()
  aiRawResult?: object;
}
