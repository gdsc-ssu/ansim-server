import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ImageService } from './image.service';
import { CreateSignedUrlDto, SaveImageDto } from './dto';
import { Image } from './entities/image.entity';
import { SignedUrlResult } from './gcs-storage.service';

@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('signed-url')
  createSignedUrl(@Body() dto: CreateSignedUrlDto): Promise<SignedUrlResult> {
    return this.imageService.createSignedUrl(dto);
  }

  @Post()
  saveImage(@Body() dto: SaveImageDto): Promise<Image> {
    return this.imageService.saveImage(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Image> {
    return this.imageService.findOne(id);
  }

  @Get()
  findAll(): Promise<Image[]> {
    return this.imageService.findAll();
  }
}
