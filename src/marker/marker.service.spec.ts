import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HazardLevel, Report } from '../report/entities/report.entity';
import { CreateMarkerDto, GetMarkersQueryDto, UpdateMarkerDto } from './dto';
import { Marker, MarkerSource } from './entities/marker.entity';
import { MarkerService } from './marker.service';

const mockReport = {
  id: 'report-uuid',
  userId: 'user-uuid',
  hazardType: '도로파손',
  hazardLevel: HazardLevel.HIGH,
  description: '도로에 큰 구멍이 있습니다.',
  aiRawResult: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
} as unknown as Report;

const mockMarker = {
  id: 'marker-uuid',
  reportId: 'report-uuid',
  source: MarkerSource.REPORT,
  latitude: 37.5665,
  longitude: 126.978,
  hazardType: '도로파손',
  hazardLevel: HazardLevel.HIGH,
  location: null,
  report: mockReport,
  createdAt: new Date('2024-01-01'),
} as unknown as Marker;

describe('MarkerService', () => {
  let service: MarkerService;

  const mockQueryBuilder = {
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  };

  const mockManager = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockMarkerRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
  };

  const mockReportRepository = {
    delete: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest
      .fn()
      .mockImplementation(
        (cb: (manager: typeof mockManager) => Promise<unknown>) =>
          cb(mockManager),
      ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarkerService,
        {
          provide: getRepositoryToken(Marker),
          useValue: mockMarkerRepository,
        },
        {
          provide: getRepositoryToken(Report),
          useValue: mockReportRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<MarkerService>(MarkerService);
    jest.clearAllMocks();

    mockQueryBuilder.insert.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.into.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.values.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.returning.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.leftJoin.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.loadRelationCountAndMap.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.where.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.andWhere.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.orderBy.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.take.mockReturnValue(mockQueryBuilder);
    mockMarkerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockDataSource.transaction.mockImplementation(
      (cb: (manager: typeof mockManager) => Promise<unknown>) =>
        cb(mockManager),
    );
  });

  // ──────────────────────────────────────────────
  // create
  // ──────────────────────────────────────────────
  describe('create', () => {
    const createDto: CreateMarkerDto = {
      latitude: 37.5665,
      longitude: 126.978,
      hazardType: '도로파손',
      hazardLevel: HazardLevel.HIGH,
      description: '도로에 큰 구멍이 있습니다.',
    };

    it('신고와 마커를 트랜잭션으로 생성하고 반환한다', async () => {
      mockQueryBuilder.execute
        .mockResolvedValueOnce({ identifiers: [{ id: 'report-uuid' }] })
        .mockResolvedValueOnce({ identifiers: [{ id: 'marker-uuid' }] });
      mockManager.findOne.mockResolvedValue(mockMarker);

      const result = await service.create('user-uuid', createDto);

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockQueryBuilder.into).toHaveBeenCalledWith(Report);
      expect(mockQueryBuilder.values).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-uuid' }),
      );
      expect(mockQueryBuilder.into).toHaveBeenCalledWith(Marker);
      expect(mockQueryBuilder.values).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: 'report-uuid',
          source: MarkerSource.REPORT,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          location: expect.any(Function),
        }),
      );
      expect(mockManager.findOne).toHaveBeenCalledWith(Marker, {
        where: { id: 'marker-uuid' },
        relations: ['report'],
      });
      expect(result).toEqual(mockMarker);
    });

    it('aiRawResult를 포함해 신고를 생성한다', async () => {
      const dtoWithAi: CreateMarkerDto = {
        ...createDto,
        aiRawResult: { label: 'pothole', confidence: 0.95 },
      };
      mockQueryBuilder.execute
        .mockResolvedValueOnce({ identifiers: [{ id: 'report-uuid' }] })
        .mockResolvedValueOnce({ identifiers: [{ id: 'marker-uuid' }] });
      mockManager.findOne.mockResolvedValue(mockMarker);

      await service.create('user-uuid', dtoWithAi);

      expect(mockQueryBuilder.values).toHaveBeenCalledWith(
        expect.objectContaining({ aiRawResult: dtoWithAi.aiRawResult }),
      );
    });

    it('마커 생성 후 findOne이 null이면 NotFoundException을 던진다', async () => {
      mockQueryBuilder.execute
        .mockResolvedValueOnce({ identifiers: [{ id: 'report-uuid' }] })
        .mockResolvedValueOnce({ identifiers: [{ id: 'marker-uuid' }] });
      mockManager.findOne.mockResolvedValue(null);

      await expect(service.create('user-uuid', createDto)).rejects.toThrow(
        new NotFoundException('마커를 찾을 수 없습니다.'),
      );
    });
  });

  // ──────────────────────────────────────────────
  // findNearby
  // ──────────────────────────────────────────────
  describe('findNearby', () => {
    const baseQuery: GetMarkersQueryDto = {
      lat: 37.5665,
      lng: 126.978,
      radius: 1000,
    };

    it('반경 내 마커 목록을 반환한다', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockMarker]);

      const result = await service.findNearby(baseQuery);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('ST_DWithin'),
        { lng: baseQuery.lng, lat: baseQuery.lat, radius: baseQuery.radius },
      );
      expect(result).toEqual([mockMarker]);
    });

    it('limit를 지정하지 않으면 기본값 100을 적용한다', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findNearby(baseQuery);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
    });

    it('limit를 지정하면 해당 값을 적용한다', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findNearby({ ...baseQuery, limit: 50 });

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
    });

    it('hazardType 필터가 있으면 andWhere를 호출한다', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockMarker]);

      await service.findNearby({ ...baseQuery, hazardType: '도로파손' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'marker.hazardType = :hazardType',
        { hazardType: '도로파손' },
      );
    });

    it('source 필터가 있으면 andWhere를 호출한다', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockMarker]);

      await service.findNearby({ ...baseQuery, source: MarkerSource.REPORT });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'marker.source = :source',
        { source: MarkerSource.REPORT },
      );
    });

    it('필터가 없으면 andWhere를 호출하지 않는다', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findNearby(baseQuery);

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('반경 내 마커가 없으면 빈 배열을 반환한다', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.findNearby(baseQuery);

      expect(result).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────
  // findOne
  // ──────────────────────────────────────────────
  describe('findOne', () => {
    it('존재하는 id로 마커를 반환한다', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockMarker);

      const result = await service.findOne('marker-uuid');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('marker.id = :id', {
        id: 'marker-uuid',
      });
      expect(result).toEqual(mockMarker);
    });

    it('존재하지 않는 id면 NotFoundException을 던진다', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        new NotFoundException('마커를 찾을 수 없습니다.'),
      );
    });

    it('likeCount, commentCount를 loadRelationCountAndMap으로 추가한다', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockMarker);

      await service.findOne('marker-uuid');

      expect(mockQueryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith(
        'marker.likeCount',
        'marker.likes',
      );
      expect(mockQueryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith(
        'marker.commentCount',
        'marker.comments',
      );
    });
  });

  // ──────────────────────────────────────────────
  // update
  // ──────────────────────────────────────────────
  describe('update', () => {
    const updateDto: UpdateMarkerDto = {
      hazardType: '화재위험',
      hazardLevel: HazardLevel.MEDIUM,
      description: '수정된 설명입니다.',
    };

    it('정상적으로 마커를 수정하고 반환한다', async () => {
      mockMarkerRepository.findOne.mockResolvedValue({ ...mockMarker });
      mockManager.update.mockResolvedValue({ affected: 1 });
      mockManager.findOne.mockResolvedValue({ ...mockMarker, ...updateDto });

      const result = await service.update(
        'marker-uuid',
        'user-uuid',
        updateDto,
      );

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(result).toMatchObject(updateDto);
    });

    it('Report와 Marker를 모두 업데이트한다', async () => {
      mockMarkerRepository.findOne.mockResolvedValue({ ...mockMarker });
      mockManager.update.mockResolvedValue({ affected: 1 });
      mockManager.findOne.mockResolvedValue(mockMarker);

      await service.update('marker-uuid', 'user-uuid', updateDto);

      expect(mockManager.update).toHaveBeenCalledWith(
        Report,
        'report-uuid',
        updateDto,
      );
      expect(mockManager.update).toHaveBeenCalledWith(Marker, 'marker-uuid', {
        hazardType: updateDto.hazardType,
        hazardLevel: updateDto.hazardLevel,
      });
    });

    it('description만 있으면 Report만 업데이트한다', async () => {
      mockMarkerRepository.findOne.mockResolvedValue({ ...mockMarker });
      mockManager.update.mockResolvedValue({ affected: 1 });
      mockManager.findOne.mockResolvedValue(mockMarker);

      await service.update('marker-uuid', 'user-uuid', {
        description: '수정된 설명',
      });

      expect(mockManager.update).toHaveBeenCalledWith(Report, 'report-uuid', {
        description: '수정된 설명',
      });
      expect(mockManager.update).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 마커면 NotFoundException을 던진다', async () => {
      mockMarkerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', 'user-uuid', updateDto),
      ).rejects.toThrow(new NotFoundException('마커를 찾을 수 없습니다.'));
    });

    it('SAFETY_MUNGO 타입 마커면 ForbiddenException을 던진다', async () => {
      mockMarkerRepository.findOne.mockResolvedValue({
        ...mockMarker,
        source: MarkerSource.SAFETY_MUNGO,
      });

      await expect(
        service.update('marker-uuid', 'user-uuid', updateDto),
      ).rejects.toThrow(
        new ForbiddenException('사용자 신고 마커만 수정할 수 있습니다.'),
      );
    });

    it('본인 마커가 아니면 ForbiddenException을 던진다', async () => {
      mockMarkerRepository.findOne.mockResolvedValue({
        ...mockMarker,
        report: { ...mockReport, userId: 'other-user-uuid' },
      });

      await expect(
        service.update('marker-uuid', 'user-uuid', updateDto),
      ).rejects.toThrow(
        new ForbiddenException('본인 마커만 수정할 수 있습니다.'),
      );
    });
  });

  // ──────────────────────────────────────────────
  // remove
  // ──────────────────────────────────────────────
  describe('remove', () => {
    it('본인 마커를 정상적으로 삭제한다', async () => {
      mockMarkerRepository.findOne.mockResolvedValue({ ...mockMarker });
      mockReportRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('marker-uuid', 'user-uuid');

      expect(mockMarkerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'marker-uuid' },
        relations: ['report'],
      });
      expect(mockReportRepository.delete).toHaveBeenCalledWith('report-uuid');
      expect(result).toBeUndefined();
    });

    it('존재하지 않는 마커면 NotFoundException을 던진다', async () => {
      mockMarkerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent-id', 'user-uuid'),
      ).rejects.toThrow(new NotFoundException('마커를 찾을 수 없습니다.'));
    });

    it('SAFETY_MUNGO 타입 마커면 ForbiddenException을 던진다', async () => {
      mockMarkerRepository.findOne.mockResolvedValue({
        ...mockMarker,
        source: MarkerSource.SAFETY_MUNGO,
      });

      await expect(service.remove('marker-uuid', 'user-uuid')).rejects.toThrow(
        new ForbiddenException('사용자 신고 마커만 삭제할 수 있습니다.'),
      );
      expect(mockReportRepository.delete).not.toHaveBeenCalled();
    });

    it('본인 마커가 아니면 ForbiddenException을 던진다', async () => {
      mockMarkerRepository.findOne.mockResolvedValue({
        ...mockMarker,
        report: { ...mockReport, userId: 'other-user-uuid' },
      });

      await expect(service.remove('marker-uuid', 'user-uuid')).rejects.toThrow(
        new ForbiddenException('본인 마커만 삭제할 수 있습니다.'),
      );
      expect(mockReportRepository.delete).not.toHaveBeenCalled();
    });
  });
});
