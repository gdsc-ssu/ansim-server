import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import { CreateReportDto, GetReportsQueryDto } from './dto';
import { ReportService } from './report.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  @ApiOperation({ summary: '반경 내 신고 목록 조회' })
  findNearby(@Query() query: GetReportsQueryDto) {
    return this.reportService.findNearby(query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 신고 목록 조회' })
  findMyReports(@Req() req: Request & { user: User }) {
    return this.reportService.findByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '신고 단건 조회' })
  findOne(@Param('id') id: string) {
    return this.reportService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '신고 생성' })
  create(@Body() dto: CreateReportDto, @Req() req: Request & { user: User }) {
    return this.reportService.create(req.user.id, dto);
  }
}
