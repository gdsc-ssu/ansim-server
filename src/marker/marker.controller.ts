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
import { CreateMarkerDto, GetMarkersQueryDto, UpdateMarkerDto } from './dto';
import { MarkerService } from './marker.service';

@ApiTags('Markers')
@Controller('markers')
export class MarkerController {
  constructor(private readonly markerService: MarkerService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '마커 생성 (신고 + 마커 동시 생성)' })
  @ApiResponse({ status: 201, description: '마커 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 (유효성 검증 실패)' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  create(@Body() dto: CreateMarkerDto, @Req() req: Request & { user: User }) {
    return this.markerService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '반경 내 마커 목록 조회' })
  @ApiResponse({ status: 200, description: '마커 목록 반환' })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (좌표/반경 유효성 실패)',
  })
  findNearby(@Query() query: GetMarkersQueryDto) {
    return this.markerService.findNearby(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '마커 단건 조회' })
  @ApiResponse({ status: 200, description: '마커 상세 반환' })
  @ApiResponse({ status: 404, description: '마커 없음' })
  findOne(@Param('id') id: string) {
    return this.markerService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '마커 수정 (REPORT 타입, 본인만)' })
  @ApiResponse({ status: 200, description: '수정된 마커 반환' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({
    status: 403,
    description: '권한 없음 (타인 마커 또는 SAFETY_MUNGO 타입)',
  })
  @ApiResponse({ status: 404, description: '마커 없음' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMarkerDto,
    @Req() req: Request & { user: User },
  ) {
    return this.markerService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '마커 삭제 (REPORT 타입, 본인만)' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({
    status: 403,
    description: '권한 없음 (타인 마커 또는 SAFETY_MUNGO 타입)',
  })
  @ApiResponse({ status: 404, description: '마커 없음' })
  remove(@Param('id') id: string, @Req() req: Request & { user: User }) {
    return this.markerService.remove(id, req.user.id);
  }
}
