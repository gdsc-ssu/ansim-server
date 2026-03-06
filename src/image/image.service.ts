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
import { GCS_URL_PREFIX } from './image.constant';

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
    if (!dto.url.startsWith(GCS_URL_PREFIX)) {
      throw new BadRequestException('URL must be a valid GCS URL');
    }

    const objectKey = dto.url.slice(
      dto.url.indexOf('/', GCS_URL_PREFIX.length) + 1,
    );
    const exists = await this.gcsStorageService.fileExists(objectKey);
    if (!exists) {
      throw new BadRequestException(
        'File not found in GCS. Please upload the file first.',
      );
    }

    const image = this.imageRepository.create({
      reportId: dto.reportId,
      url: dto.url,
      mimeType: dto.mimeType,
      size: dto.size,
    });

    return this.imageRepository.save(image);
  }

  async findOne(id: string): Promise<Image> {
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
