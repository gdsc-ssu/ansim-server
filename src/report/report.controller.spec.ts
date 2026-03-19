import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { HazardLevel, HazardType } from '../common/enums/hazard.enum';
import { Report } from './entities/report.entity';
import { CreateReportDto, GetReportsQueryDto, UpdateReportDto } from './dto';
import { Request } from 'express';
import { User } from '../user/entities/user.entity';

const mockUser = {
  id: 'user-uuid',
  googleId: 'google-123',
  email: 'test@example.com',
  name: '홍길동',
  profileImage: null,
  createdAt: new Date('2024-01-01'),
  reports: [],
  comments: [],
  likes: [],
} as unknown as User;

const mockReport = {
  id: 'report-uuid',
  userId: 'user-uuid',
  imageUrl: 'https://example.com/image.jpg',
  latitude: 37.5665,
  longitude: 126.978,
  location: null,
  hazardType: HazardType.ROAD_DAMAGE,
  hazardLevel: HazardLevel.HIGH,
  description: '도로에 큰 구멍이 있습니다.',
  aiRawResult: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  user: null,
  comments: [],
  likes: [],
} as unknown as Report;

const mockRequest = {
  user: mockUser,
} as Request & { user: User };

describe('ReportController', () => {
  let controller: ReportController;

  const mockReportService = {
    findNearby: jest.fn(),
    findByUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        {
          provide: ReportService,
          useValue: mockReportService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReportController>(ReportController);

    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────
  // GET /reports
  // ──────────────────────────────────────────────
  describe('findNearby', () => {
    it('query를 전달해 서비스를 호출하고 결과를 반환한다', async () => {
      const query: GetReportsQueryDto = {
        lat: 37.5665,
        lng: 126.978,
        radius: 1000,
      };
      mockReportService.findNearby.mockResolvedValue([mockReport]);

      const result = await controller.findNearby(query);

      expect(mockReportService.findNearby).toHaveBeenCalledWith(query);
      expect(result).toEqual([mockReport]);
    });
  });

  // ──────────────────────────────────────────────
  // GET /reports/me
  // ──────────────────────────────────────────────
  describe('findMyReports', () => {
    it('req.user.id로 서비스를 호출하고 결과를 반환한다', async () => {
      mockReportService.findByUser.mockResolvedValue([mockReport]);

      const result = await controller.findMyReports(mockRequest);

      expect(mockReportService.findByUser).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual([mockReport]);
    });
  });

  // ──────────────────────────────────────────────
  // GET /reports/:id
  // ──────────────────────────────────────────────
  describe('findOne', () => {
    it('id를 전달해 서비스를 호출하고 결과를 반환한다', async () => {
      mockReportService.findOne.mockResolvedValue(mockReport);

      const result = await controller.findOne('report-uuid');

      expect(mockReportService.findOne).toHaveBeenCalledWith('report-uuid');
      expect(result).toEqual(mockReport);
    });
  });

  // ──────────────────────────────────────────────
  // PATCH /reports/:id
  // ──────────────────────────────────────────────
  describe('update', () => {
    it('id, req.user.id, dto를 전달해 서비스를 호출하고 결과를 반환한다', async () => {
      const updateDto: UpdateReportDto = {
        description: '수정된 설명입니다.',
        hazardLevel: HazardLevel.MEDIUM,
      };
      const updatedReport = { ...mockReport, ...updateDto };
      mockReportService.update.mockResolvedValue(updatedReport);

      const result = await controller.update(
        'report-uuid',
        updateDto,
        mockRequest,
      );

      expect(mockReportService.update).toHaveBeenCalledWith(
        'report-uuid',
        mockUser.id,
        updateDto,
      );
      expect(result).toEqual(updatedReport);
    });
  });

  // ──────────────────────────────────────────────
  // DELETE /reports/:id
  // ──────────────────────────────────────────────
  describe('remove', () => {
    it('id, req.user.id를 전달해 서비스를 호출한다', async () => {
      mockReportService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('report-uuid', mockRequest);

      expect(mockReportService.remove).toHaveBeenCalledWith(
        'report-uuid',
        mockUser.id,
      );
      expect(result).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────
  // POST /reports
  // ──────────────────────────────────────────────
  describe('create', () => {
    it('req.user.id, dto를 전달해 서비스를 호출하고 결과를 반환한다', async () => {
      const createDto: CreateReportDto = {
        imageUrl: 'https://example.com/image.jpg',
        latitude: 37.5665,
        longitude: 126.978,
        hazardType: HazardType.ROAD_DAMAGE,
        hazardLevel: HazardLevel.HIGH,
        description: '도로에 큰 구멍이 있습니다.',
      };
      mockReportService.create.mockResolvedValue(mockReport);

      const result = await controller.create(createDto, mockRequest);

      expect(mockReportService.create).toHaveBeenCalledWith(
        mockUser.id,
        createDto,
      );
      expect(result).toEqual(mockReport);
    });
  });
});
