import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUser: User = { id: 1, email: 'test@example.com', name: 'Test' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      jest.spyOn(service, 'findAll').mockResolvedValue(users);

      expect(await controller.findAll()).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);

      expect(await controller.findOne(1)).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
