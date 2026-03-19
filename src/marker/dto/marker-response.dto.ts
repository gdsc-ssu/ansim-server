import { ApiProperty } from '@nestjs/swagger';
import { HazardLevel, HazardType } from '../../common/enums/hazard.enum';
import { MarkerSource } from '../entities/marker.entity';

export class ImageInReportDto {
  @ApiProperty({ description: '이미지 ID (UUID)' })
  id: string;

  @ApiProperty({ description: '이미지 URL' })
  url: string;

  @ApiProperty({ description: 'MIME 타입', example: 'image/jpeg' })
  mimeType: string;

  @ApiProperty({ description: '파일 크기 (bytes)', nullable: true })
  size: number | null;

  @ApiProperty({ description: '생성 시각 (ISO 8601)' })
  createdAt: Date;
}

export class ReportInMarkerDto {
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
    description: '신고 내용',
    example: '도로에 포트홀이 있습니다.',
  })
  description: string;

  @ApiProperty({
    description: 'AI 분석 원본 결과 (nullable)',
    nullable: true,
    required: false,
  })
  aiRawResult: object | null;

  @ApiProperty({
    description: '첨부 이미지 목록',
    type: [ImageInReportDto],
  })
  images: ImageInReportDto[];

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

export class SafetyMungoReportInMarkerDto {
  @ApiProperty({
    description: '안전신문고 리포트 ID (unique_key)',
    example: 'a3f8c2e1b9d4...',
  })
  id: string;

  @ApiProperty({ description: '장소명', nullable: true, required: false })
  spotName: string | null;

  @ApiProperty({
    description: '신고 카테고리',
    nullable: true,
    required: false,
  })
  category: string | null;

  @ApiProperty({ description: '신고 내용', nullable: true, required: false })
  description: string | null;

  @ApiProperty({ description: '출처 기관', nullable: true, required: false })
  origin: string | null;

  @ApiProperty({
    description: '발생 일자',
    nullable: true,
    required: false,
    example: '2025-10-01',
  })
  occurrenceDate: Date | null;
}

export class MarkerResponseDto {
  @ApiProperty({
    description: '마커 ID (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({ description: '마커 출처', enum: MarkerSource })
  source: MarkerSource;

  @ApiProperty({ description: '위도', example: 37.4971 })
  latitude: number;

  @ApiProperty({ description: '경도', example: 126.9568 })
  longitude: number;

  @ApiProperty({
    description: '위험 유형',
    enum: HazardType,
    example: HazardType.ROAD_DAMAGE,
  })
  hazardType: HazardType;

  @ApiProperty({
    description: '위험 등급 (nullable)',
    enum: HazardLevel,
    nullable: true,
    required: false,
  })
  hazardLevel: HazardLevel | null;

  @ApiProperty({
    description: '생성 시각 (ISO 8601)',
    example: '2026-03-11T09:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({ description: '좋아요 수', example: 5 })
  likeCount: number;

  @ApiProperty({ description: '댓글 수', example: 3 })
  commentCount: number;
}

export class MarkerDetailResponseDto extends MarkerResponseDto {
  @ApiProperty({
    description: 'REPORT 타입일 때의 신고 상세 (nullable)',
    type: ReportInMarkerDto,
    nullable: true,
    required: false,
  })
  report: ReportInMarkerDto | null;

  @ApiProperty({
    description: 'SAFETY_MUNGO 타입일 때의 안전신문고 상세 (nullable)',
    type: SafetyMungoReportInMarkerDto,
    nullable: true,
    required: false,
  })
  safetyMungoReport: SafetyMungoReportInMarkerDto | null;
}
