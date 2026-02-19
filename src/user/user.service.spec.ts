import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  const mockUser: User = { id: 1, email: 'test@example.com', name: 'Test' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      jest.spyOn(repository, 'find').mockResolvedValue(users);

      expect(await service.findAll()).toEqual(users);
    });

    it('should return empty array when no users exist', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockUser);

      expect(await service.findOne(1)).toEqual(mockUser);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
