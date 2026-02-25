import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ImageService } from './image.service';
import { Image } from './entities/image.entity';
import { GcsStorageService } from './gcs-storage.service';

describe('ImageService', () => {
  let service: ImageService;
  let repository: Repository<Image>;
  let gcsStorageService: GcsStorageService;

  const mockImage: Image = {
    id: 1,
    url: 'https://storage.googleapis.com/test-bucket/images/test.jpg',
    mimeType: 'image/jpeg',
    size: 1024,
    createdAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageService,
        {
          provide: getRepositoryToken(Image),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: GcsStorageService,
          useValue: {
            generateSignedUrl: jest.fn(),
            fileExists: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ImageService>(ImageService);
    repository = module.get<Repository<Image>>(getRepositoryToken(Image));
    gcsStorageService = module.get<GcsStorageService>(GcsStorageService);
  });

  describe('createSignedUrl', () => {
    it('should return signed URL result', async () => {
      const dto = {
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
        fileSize: 1024,
      };
      const signedUrlResult = {
        signedUrl: 'https://storage.googleapis.com/signed-url',
        publicUrl: 'https://storage.googleapis.com/test-bucket/images/uuid.jpg',
      };

      const spy = jest
        .spyOn(gcsStorageService, 'generateSignedUrl')
        .mockResolvedValue(signedUrlResult);

      expect(await service.createSignedUrl(dto)).toEqual(signedUrlResult);
      expect(spy).toHaveBeenCalledWith('photo.jpg', 'image/jpeg', 1024);
    });
  });

  describe('saveImage', () => {
    it('should save and return an image', async () => {
      const dto = {
        url: 'https://storage.googleapis.com/test-bucket/images/test.jpg',
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
      };

      const fileExistsSpy = jest
        .spyOn(gcsStorageService, 'fileExists')
        .mockResolvedValue(true);
      const createSpy = jest
        .spyOn(repository, 'create')
        .mockReturnValue(mockImage);
      jest.spyOn(repository, 'save').mockResolvedValue(mockImage);

      expect(await service.saveImage(dto)).toEqual(mockImage);
      expect(fileExistsSpy).toHaveBeenCalledWith('images/test.jpg');
      expect(createSpy).toHaveBeenCalledWith({
        url: dto.url,
        mimeType: dto.mimeType,
        size: dto.size,
      });
    });

    it('should throw BadRequestException for non-GCS URL', async () => {
      const dto = {
        url: 'https://example.com/image.jpg',
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
      };

      await expect(service.saveImage(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when file does not exist in GCS', async () => {
      const dto = {
        url: 'https://storage.googleapis.com/test-bucket/images/missing.jpg',
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
      };

      jest.spyOn(gcsStorageService, 'fileExists').mockResolvedValue(false);

      await expect(service.saveImage(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return an image by id', async () => {
      const spy = jest
        .spyOn(repository, 'findOneBy')
        .mockResolvedValue(mockImage);

      expect(await service.findOne(1)).toEqual(mockImage);
      expect(spy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should throw NotFoundException when image not found', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return an array of images', async () => {
      const images = [mockImage];
      jest.spyOn(repository, 'find').mockResolvedValue(images);

      expect(await service.findAll()).toEqual(images);
    });

    it('should return empty array when no images exist', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      expect(await service.findAll()).toEqual([]);
    });
  });
});
