import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { Image } from './entities/image.entity';

describe('ImageController', () => {
  let controller: ImageController;
  let service: ImageService;

  const mockImage: Image = {
    id: 1,
    url: 'https://storage.googleapis.com/test-bucket/images/test.jpg',
    mimeType: 'image/jpeg',
    size: 1024,
    createdAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImageController],
      providers: [
        {
          provide: ImageService,
          useValue: {
            createSignedUrl: jest.fn(),
            saveImage: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ImageController>(ImageController);
    service = module.get<ImageService>(ImageService);
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

      jest.spyOn(service, 'createSignedUrl').mockResolvedValue(signedUrlResult);

      expect(await controller.createSignedUrl(dto)).toEqual(signedUrlResult);
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

      jest.spyOn(service, 'saveImage').mockResolvedValue(mockImage);

      expect(await controller.saveImage(dto)).toEqual(mockImage);
    });
  });

  describe('findOne', () => {
    it('should return an image by id', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockImage);

      expect(await controller.findOne(1)).toEqual(mockImage);
    });

    it('should propagate NotFoundException', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return an array of images', async () => {
      const images = [mockImage];
      jest.spyOn(service, 'findAll').mockResolvedValue(images);

      expect(await controller.findAll()).toEqual(images);
    });
  });
});
