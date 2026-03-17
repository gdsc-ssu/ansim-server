import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  const mockUser: User = {
    id: 'uuid-1234',
    googleId: 'google-sub-1234',
    email: 'test@example.com',
    name: 'Test User',
    profileImage: 'https://example.com/photo.jpg',
    address: '',
    nearbyDangerAlert: true,
    emergencyAlert: true,
    createdAt: new Date(),
    reports: [],
    comments: [],
    likes: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByGoogleId', () => {
    it('should return a user when found', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockUser);
      expect(await service.findByGoogleId('google-sub-1234')).toEqual(mockUser);
    });

    it('should return null when not found', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);
      expect(await service.findByGoogleId('unknown')).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockUser);
      expect(await service.findById('uuid-1234')).toEqual(mockUser);
    });

    it('should return null when not found', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);
      expect(await service.findById('unknown')).toBeNull();
    });
  });

  describe('findOrCreate', () => {
    it('should return existing user when found', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockUser);
      const createSpy = jest.spyOn(repository, 'create');

      const result = await service.findOrCreate({
        googleId: 'google-sub-1234',
        email: 'test@example.com',
      });

      expect(result).toEqual(mockUser);
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('should create and return new user when not found', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);
      const createSpy = jest
        .spyOn(repository, 'create')
        .mockReturnValue(mockUser);
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue(mockUser);

      const result = await service.findOrCreate({
        googleId: 'google-sub-1234',
        email: 'test@example.com',
      });

      expect(result).toEqual(mockUser);
      expect(createSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
    });
  });
});
