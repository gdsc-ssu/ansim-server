import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HazardLevel } from '../entities/report.entity';

export class ReportResponseDto {
  @ApiProperty({ description: '신고 ID (UUID)' })
  id: string;

  @ApiProperty({ description: '신고자 사용자 ID' })
  userId: string;

  @ApiProperty({ description: '위험 유형', example: '화재' })
  hazardType: string;

  @ApiProperty({ description: '위험 등급', enum: HazardLevel })
  hazardLevel: HazardLevel;

  @ApiProperty({ description: '신고 내용' })
  description: string;

  @ApiPropertyOptional({ description: '좋아요 수' })
  likeCount?: number;

  @ApiPropertyOptional({ description: '댓글 수' })
  commentCount?: number;

  @ApiProperty({ description: '생성 시각' })
  createdAt: Date;

  @ApiProperty({ description: '수정 시각' })
  updatedAt: Date;
}
