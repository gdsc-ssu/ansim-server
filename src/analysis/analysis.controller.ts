import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AnalysisService } from './analysis.service';
import { AnalyzeImageDto, AnalysisResultDto } from './dto';

@ApiTags('analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post()
  @ApiOperation({ summary: '이미지 위험도 분석' })
  @ApiResponse({ status: 201, type: AnalysisResultDto })
  @ApiBadRequestResponse({
    description: 'GCS URL이 아니거나 이미지 fetch 실패',
  })
  @ApiUnprocessableEntityResponse({ description: '이미지에서 위험 요소 없음' })
  analyze(@Body() dto: AnalyzeImageDto): Promise<AnalysisResultDto> {
    return this.analysisService.analyze(dto.imageUrls);
  }
}
