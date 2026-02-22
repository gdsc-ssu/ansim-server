import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from './entities/image.entity';
import { GcsStorageService, SignedUrlResult } from './gcs-storage.service';
import { CreateSignedUrlDto, SaveImageDto } from './dto';

@Injectable()
export class ImageService {
  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    private readonly gcsStorageService: GcsStorageService,
  ) {}

  async createSignedUrl(dto: CreateSignedUrlDto): Promise<SignedUrlResult> {
    return this.gcsStorageService.generateSignedUrl(
      dto.fileName,
      dto.contentType,
      dto.fileSize,
    );
  }

  async saveImage(dto: SaveImageDto): Promise<Image> {
    if (!dto.url.startsWith('https://storage.googleapis.com/')) {
      throw new BadRequestException('URL must be a valid GCS URL');
    }

    const image = this.imageRepository.create({
      url: dto.url,
      mimeType: dto.mimeType,
      size: dto.size,
    });

    return this.imageRepository.save(image);
  }

  async findOne(id: number): Promise<Image> {
    const image = await this.imageRepository.findOneBy({ id });
    if (!image) {
      throw new NotFoundException(`Image with id ${id} not found`);
    }
    return image;
  }

  async findAll(): Promise<Image[]> {
    return this.imageRepository.find();
  }
}
