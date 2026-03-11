import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import {
  CreateReportDto,
  GetReportsQueryDto,
  ReportResponseDto,
  UpdateReportDto,
} from './dto';
import { ReportService } from './report.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  @ApiOperation({ summary: '반경 내 신고 목록 조회' })
  @ApiResponse({ status: 200, type: [ReportResponseDto] })
  @ApiBadRequestResponse({
    description:
      '쿼리 파라미터 유효성 검증 실패 (lat/lng/radius 누락 또는 범위 초과)',
  })
  findNearby(@Query() query: GetReportsQueryDto): Promise<ReportResponseDto[]> {
    return this.reportService.findNearby(query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 신고 목록 조회' })
  @ApiResponse({ status: 200, type: [ReportResponseDto] })
  @ApiUnauthorizedResponse({
    description: 'Authorization 헤더 없음 또는 만료된 Access Token',
  })
  findMyReports(
    @Req() req: Request & { user: User },
  ): Promise<ReportResponseDto[]> {
    return this.reportService.findByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '신고 단건 조회' })
  @ApiParam({
    name: 'id',
    description: '신고 ID (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  @ApiNotFoundResponse({ description: '해당 ID의 신고를 찾을 수 없음' })
  findOne(@Param('id') id: string): Promise<ReportResponseDto> {
    return this.reportService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '신고 수정 (본인만)' })
  @ApiParam({
    name: 'id',
    description: '신고 ID (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  @ApiBadRequestResponse({ description: '요청 바디 유효성 검증 실패' })
  @ApiUnauthorizedResponse({
    description: 'Authorization 헤더 없음 또는 만료된 Access Token',
  })
  @ApiForbiddenResponse({ description: '본인 신고가 아님' })
  @ApiNotFoundResponse({ description: '해당 ID의 신고를 찾을 수 없음' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
    @Req() req: Request & { user: User },
  ): Promise<ReportResponseDto> {
    return this.reportService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '신고 삭제 (본인만)' })
  @ApiParam({
    name: 'id',
    description: '신고 ID (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiUnauthorizedResponse({
    description: 'Authorization 헤더 없음 또는 만료된 Access Token',
  })
  @ApiForbiddenResponse({ description: '본인 신고가 아님' })
  @ApiNotFoundResponse({ description: '해당 ID의 신고를 찾을 수 없음' })
  remove(@Param('id') id: string, @Req() req: Request & { user: User }) {
    return this.reportService.remove(id, req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '신고 생성' })
  @ApiResponse({ status: 201, type: ReportResponseDto })
  @ApiBadRequestResponse({
    description:
      '요청 바디 유효성 검증 실패 (필수 필드 누락 또는 잘못된 hazardLevel)',
  })
  @ApiUnauthorizedResponse({
    description: 'Authorization 헤더 없음 또는 만료된 Access Token',
  })
  create(
    @Body() dto: CreateReportDto,
    @Req() req: Request & { user: User },
  ): Promise<ReportResponseDto> {
    return this.reportService.create(req.user.id, dto);
  }
}
