import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const mockUser = {
  id: 'user-uuid',
  googleId: 'google-123',
  email: 'test@example.com',
  name: '김안심',
  profileImage: 'https://example.com/photo.jpg',
  address: '강동구 천호동',
  nearbyDangerAlert: true,
  emergencyAlert: true,
  createdAt: new Date('2024-01-01'),
} as unknown as User;

const mockRequest = {
  user: mockUser,
} as Request & { user: User };

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    updateProfile: jest.fn(),
    updateSettings: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ──────────────────────────────────────────────
  // GET /users/me
  // ──────────────────────────────────────────────
  describe('getMyProfile', () => {
    it('req.user 정보를 기반으로 프로필을 반환한다', () => {
      const result = controller.getMyProfile(mockRequest);

      expect(result).toEqual({
        id: 'user-uuid',
        email: 'test@example.com',
        name: '김안심',
        profileImage: 'https://example.com/photo.jpg',
        address: '강동구 천호동',
        settings: {
          nearbyDangerAlert: true,
          emergencyAlert: true,
        },
        createdAt: new Date('2024-01-01'),
      });
    });

    it('name, profileImage, address가 없으면 null을 반환한다', () => {
      const userWithoutOptionals = {
        ...mockUser,
        name: undefined,
        profileImage: undefined,
        address: undefined,
      } as unknown as User;
      const req = { user: userWithoutOptionals } as Request & { user: User };

      const result = controller.getMyProfile(req);

      expect(result.name).toBeNull();
      expect(result.profileImage).toBeNull();
      expect(result.address).toBeNull();
    });
  });

  // ──────────────────────────────────────────────
  // PATCH /users/me
  // ──────────────────────────────────────────────
  describe('updateMyProfile', () => {
    it('req.user.id, dto를 전달해 서비스를 호출하고 프로필을 반환한다', async () => {
      const dto: UpdateProfileDto = {
        name: '새이름',
        address: '송파구 잠실동',
      };
      const updatedUser = { ...mockUser, ...dto };
      mockUserService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateMyProfile(mockRequest, dto);

      expect(mockUserService.updateProfile).toHaveBeenCalledWith(
        'user-uuid',
        dto,
      );
      expect(result).toEqual({
        id: 'user-uuid',
        email: 'test@example.com',
        name: '새이름',
        profileImage: 'https://example.com/photo.jpg',
        address: '송파구 잠실동',
        settings: {
          nearbyDangerAlert: true,
          emergencyAlert: true,
        },
        createdAt: new Date('2024-01-01'),
      });
    });
  });

  // ──────────────────────────────────────────────
  // PATCH /users/me/settings
  // ──────────────────────────────────────────────
  describe('updateMySettings', () => {
    it('req.user.id, dto를 전달해 서비스를 호출하고 설정을 반환한다', async () => {
      const dto: UpdateSettingsDto = {
        nearbyDangerAlert: false,
        emergencyAlert: true,
      };
      const updatedUser = { ...mockUser, ...dto };
      mockUserService.updateSettings.mockResolvedValue(updatedUser);

      const result = await controller.updateMySettings(mockRequest, dto);

      expect(mockUserService.updateSettings).toHaveBeenCalledWith(
        'user-uuid',
        dto,
      );
      expect(result).toEqual({
        nearbyDangerAlert: false,
        emergencyAlert: true,
      });
    });

    it('하나의 설정만 변경해도 전체 설정을 반환한다', async () => {
      const dto: UpdateSettingsDto = {
        emergencyAlert: false,
      };
      const updatedUser = { ...mockUser, emergencyAlert: false };
      mockUserService.updateSettings.mockResolvedValue(updatedUser);

      const result = await controller.updateMySettings(mockRequest, dto);

      expect(mockUserService.updateSettings).toHaveBeenCalledWith(
        'user-uuid',
        dto,
      );
      expect(result).toEqual({
        nearbyDangerAlert: true,
        emergencyAlert: false,
      });
    });
  });
});
