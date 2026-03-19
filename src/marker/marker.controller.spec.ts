import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { HazardLevel, HazardType } from '../common/enums/hazard.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import { CreateMarkerDto, GetMarkersQueryDto, UpdateMarkerDto } from './dto';
import { Marker, MarkerSource } from './entities/marker.entity';
import { MarkerController } from './marker.controller';
import { MarkerService } from './marker.service';

const mockUser = {
  id: 'user-uuid',
  googleId: 'google-123',
  email: 'test@example.com',
  name: '홍길동',
  profileImage: null,
  createdAt: new Date('2024-01-01'),
} as unknown as User;

const mockMarker = {
  id: 'marker-uuid',
  reportId: 'report-uuid',
  source: MarkerSource.REPORT,
  latitude: 37.5665,
  longitude: 126.978,
  hazardType: HazardType.ROAD_DAMAGE,
  hazardLevel: HazardLevel.HIGH,
  location: null,
  report: null,
  createdAt: new Date('2024-01-01'),
} as unknown as Marker;

const mockRequest = {
  user: mockUser,
} as Request & { user: User };

describe('MarkerController', () => {
  let controller: MarkerController;

  const mockMarkerService = {
    create: jest.fn(),
    findNearby: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarkerController],
      providers: [
        {
          provide: MarkerService,
          useValue: mockMarkerService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MarkerController>(MarkerController);
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────
  // POST /markers
  // ──────────────────────────────────────────────
  describe('create', () => {
    it('req.user.id, dto를 전달해 서비스를 호출하고 결과를 반환한다', async () => {
      const createDto: CreateMarkerDto = {
        latitude: 37.5665,
        longitude: 126.978,
        hazardType: HazardType.ROAD_DAMAGE,
        hazardLevel: HazardLevel.HIGH,
        description: '도로에 큰 구멍이 있습니다.',
      };
      mockMarkerService.create.mockResolvedValue(mockMarker);

      const result = await controller.create(createDto, mockRequest);

      expect(mockMarkerService.create).toHaveBeenCalledWith(
        mockUser.id,
        createDto,
      );
      expect(result).toEqual(mockMarker);
    });
  });

  // ──────────────────────────────────────────────
  // GET /markers
  // ──────────────────────────────────────────────
  describe('findNearby', () => {
    it('query를 전달해 서비스를 호출하고 결과를 반환한다', async () => {
      const query: GetMarkersQueryDto = {
        lat: 37.5665,
        lng: 126.978,
        radius: 1000,
      };
      mockMarkerService.findNearby.mockResolvedValue([mockMarker]);

      const result = await controller.findNearby(query);

      expect(mockMarkerService.findNearby).toHaveBeenCalledWith(query);
      expect(result).toEqual([mockMarker]);
    });
  });

  // ──────────────────────────────────────────────
  // GET /markers/:id
  // ──────────────────────────────────────────────
  describe('findOne', () => {
    it('id를 전달해 서비스를 호출하고 결과를 반환한다', async () => {
      mockMarkerService.findOne.mockResolvedValue(mockMarker);

      const result = await controller.findOne('marker-uuid');

      expect(mockMarkerService.findOne).toHaveBeenCalledWith('marker-uuid');
      expect(result).toEqual(mockMarker);
    });
  });

  // ──────────────────────────────────────────────
  // PATCH /markers/:id
  // ──────────────────────────────────────────────
  describe('update', () => {
    it('id, req.user.id, dto를 전달해 서비스를 호출하고 결과를 반환한다', async () => {
      const updateDto: UpdateMarkerDto = {
        hazardType: HazardType.FIRE,
        hazardLevel: HazardLevel.MEDIUM,
      };
      const updatedMarker = { ...mockMarker, ...updateDto };
      mockMarkerService.update.mockResolvedValue(updatedMarker);

      const result = await controller.update(
        'marker-uuid',
        updateDto,
        mockRequest,
      );

      expect(mockMarkerService.update).toHaveBeenCalledWith(
        'marker-uuid',
        mockUser.id,
        updateDto,
      );
      expect(result).toEqual(updatedMarker);
    });
  });

  // ──────────────────────────────────────────────
  // DELETE /markers/:id
  // ──────────────────────────────────────────────
  describe('remove', () => {
    it('id, req.user.id를 전달해 서비스를 호출한다', async () => {
      mockMarkerService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('marker-uuid', mockRequest);

      expect(mockMarkerService.remove).toHaveBeenCalledWith(
        'marker-uuid',
        mockUser.id,
      );
      expect(result).toBeUndefined();
    });
  });
});
