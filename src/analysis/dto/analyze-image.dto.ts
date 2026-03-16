import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUrl } from 'class-validator';

export class AnalyzeImageDto {
  @ApiProperty({
    description: '분석할 GCS 이미지 URL 목록 (5장 초과 시 앞 5장만 분석)',
    example: ['https://storage.googleapis.com/ansim-bucket/images/abc123.jpg'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUrl({}, { each: true })
  imageUrls: string[];
}
