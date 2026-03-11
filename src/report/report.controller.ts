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
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
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
  findNearby(@Query() query: GetReportsQueryDto): Promise<ReportResponseDto[]> {
    return this.reportService.findNearby(query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 신고 목록 조회' })
  @ApiResponse({ status: 200, type: [ReportResponseDto] })
  findMyReports(
    @Req() req: Request & { user: User },
  ): Promise<ReportResponseDto[]> {
    return this.reportService.findByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '신고 단건 조회' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
  findOne(@Param('id') id: string): Promise<ReportResponseDto> {
    return this.reportService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '신고 수정 (본인만)' })
  @ApiResponse({ status: 200, type: ReportResponseDto })
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
  @ApiResponse({ status: 204, description: '삭제 성공' })
  remove(@Param('id') id: string, @Req() req: Request & { user: User }) {
    return this.reportService.remove(id, req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '신고 생성' })
  @ApiResponse({ status: 201, type: ReportResponseDto })
  create(
    @Body() dto: CreateReportDto,
    @Req() req: Request & { user: User },
  ): Promise<ReportResponseDto> {
    return this.reportService.create(req.user.id, dto);
  }
}
