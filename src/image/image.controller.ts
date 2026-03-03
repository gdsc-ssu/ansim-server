import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ImageService } from './image.service';
import { CreateSignedUrlDto, SaveImageDto } from './dto';
import { Image } from './entities/image.entity';
import { SignedUrlResult } from './gcs-storage.service';

@ApiTags('images')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('signed-url')
  @ApiOperation({ summary: 'GCS Signed URL 발급' })
  createSignedUrl(@Body() dto: CreateSignedUrlDto): Promise<SignedUrlResult> {
    return this.imageService.createSignedUrl(dto);
  }

  @Post()
  @ApiOperation({ summary: '이미지 저장' })
  saveImage(@Body() dto: SaveImageDto): Promise<Image> {
    return this.imageService.saveImage(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '이미지 단건 조회' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Image> {
    return this.imageService.findOne(id);
  }

  @Get()
  @ApiOperation({ summary: '이미지 전체 조회' })
  findAll(): Promise<Image[]> {
    return this.imageService.findAll();
  }
}
