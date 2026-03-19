import { ApiProperty } from '@nestjs/swagger';
import { HazardLevel, HazardType } from '../../common/enums/hazard.enum';

export class ReportResponseDto {
  @ApiProperty({
    description: '신고 ID (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: '신고자 사용자 ID (UUID)',
    example: 'f0e1d2c3-b4a5-6789-fedc-ba0987654321',
  })
  userId: string;

  @ApiProperty({
    description: '위험 유형',
    enum: HazardType,
    example: HazardType.FIRE,
  })
  hazardType: HazardType;

  @ApiProperty({ description: '위험 등급', enum: HazardLevel })
  hazardLevel: HazardLevel;

  @ApiProperty({ description: '신고 내용', example: '건물에서 연기가 납니다.' })
  description: string;

  @ApiProperty({
    description: '생성 시각 (ISO 8601)',
    example: '2026-03-11T09:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 시각 (ISO 8601)',
    example: '2026-03-11T10:30:00.000Z',
  })
  updatedAt: Date;
}
