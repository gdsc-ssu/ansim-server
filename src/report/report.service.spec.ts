import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { Report, HazardLevel } from './entities/report.entity';
import { CreateReportDto, GetReportsQueryDto, UpdateReportDto } from './dto';

const mockReport = {
  id: 'report-uuid',
  userId: 'user-uuid',
  hazardType: '도로파손',
  hazardLevel: HazardLevel.HIGH,
  description: '도로에 큰 구멍이 있습니다.',
  aiRawResult: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  user: null,
} as unknown as Report;

describe('ReportService', () => {
  let service: ReportService;

  const mockQueryBuilder = {
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    // innerJoin, leftJoin 추가 — findNearby/findOne에서 marker 조인에 사용
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getOneOrFail: jest.fn(),
    getMany: jest.fn(),
  };

  const mockReportRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: getRepositoryToken(Report),
          useValue: mockReportRepository,
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    jest.clearAllMocks();
    mockReportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.insert.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.into.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.values.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.returning.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.innerJoin.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.leftJoin.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.addSelect.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.loadRelationCountAndMap.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.where.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.andWhere.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.orderBy.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.getOneOrFail.mockReturnValue(mockQueryBuilder);
  });

  // ──────────────────────────────────────────────
  // create
  // ──────────────────────────────────────────────
  describe('create', () => {
    const createDto: CreateReportDto = {
      hazardType: '도로파손',
      hazardLevel: HazardLevel.HIGH,
      description: '도로에 큰 구멍이 있습니다.',
    };

    it('신고를 정상적으로 생성하고 likeCount/commentCount를 포함해 반환한다', async () => {
      mockQueryBuilder.execute.mockResolvedValue({
        identifiers: [{ id: 'report-uuid' }],
      });
      mockQueryBuilder.getOne.mockResolvedValue({
        ...mockReport,
        likeCount: 0,
        commentCount: 0,
      });

      const result = await service.create('user-uuid', createDto);

      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(mockQueryBuilder.into).toHaveBeenCalledWith(Report);
      expect(mockQueryBuilder.values).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-uuid' }),
      );
      expect(mockQueryBuilder.returning).toHaveBeenCalledWith('id');
      // insert 후 findOne(id)를 호출해 likeCount/commentCount 로드
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'report.marker',
        'marker',
      );
      expect(mockQueryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith(
        'report.likeCount',
        'marker.likes',
      );
      expect(mockQueryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith(
        'report.commentCount',
        'marker.comments',
      );
      expect(result.likeCount).toBe(0);
      expect(result.commentCount).toBe(0);
    });

    it('aiRawResult는 DB에 저장되지만 응답에서 제외된다', async () => {
      const dtoWithAi: CreateReportDto = {
        ...createDto,
        aiRawResult: { label: 'pothole', confidence: 0.95 },
      };
      mockQueryBuilder.execute.mockResolvedValue({
        identifiers: [{ id: 'report-uuid' }],
      });
      // findOne 내부 getOne은 aiRawResult 없이 반환 (select로 제외됨)
      mockQueryBuilder.getOne.mockResolvedValue({
        ...mockReport,
        likeCount: 0,
        commentCount: 0,
      });

      const result = await service.create('user-uuid', dtoWithAi);

      expect(mockQueryBuilder.values).toHaveBeenCalledWith(
        expect.objectContaining({ aiRawResult: dtoWithAi.aiRawResult }),
      );
      expect(result.aiRawResult).toBeUndefined();
    });

    it('insert 후 신고를 찾을 수 없으면 NotFoundException을 던진다', async () => {
      mockQueryBuilder.execute.mockResolvedValue({
        identifiers: [{ id: 'report-uuid' }],
      });
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.create('user-uuid', createDto)).rejects.toThrow(
        new NotFoundException('신고를 찾을 수 없습니다.'),
      );
    });
  });

  // ──────────────────────────────────────────────
  // findNearby
  // ──────────────────────────────────────────────
  describe('findNearby', () => {
    const baseQuery: GetReportsQueryDto = {
      lat: 37.5665,
      lng: 126.978,
      radius: 1000,
    };

    it('반경 내 신고 목록을 반환한다', async () => {
      mockReportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([mockReport]);

      const result = await service.findNearby(baseQuery);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('ST_DWithin'),
        { lng: baseQuery.lng, lat: baseQuery.lat, radius: baseQuery.radius },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'report.createdAt',
        'DESC',
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual([mockReport]);
    });

    it('hazardType 필터가 있으면 andWhere를 호출한다', async () => {
      mockReportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([mockReport]);

      await service.findNearby({ ...baseQuery, hazardType: '도로파손' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'report.hazardType = :hazardType',
        { hazardType: '도로파손' },
      );
    });

    it('hazardType 필터가 없으면 andWhere를 호출하지 않는다', async () => {
      mockReportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([mockReport]);

      await service.findNearby(baseQuery);

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('반경 내 신고가 없으면 빈 배열을 반환한다', async () => {
      mockReportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.findNearby(baseQuery);

      expect(result).toEqual([]);
    });

    it('likeCount, commentCount를 loadRelationCountAndMap으로 추가한다', async () => {
      mockReportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findNearby(baseQuery);

      expect(mockQueryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith(
        'report.likeCount',
        'marker.likes',
      );
      expect(mockQueryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith(
        'report.commentCount',
        'marker.comments',
      );
    });
  });

  // ──────────────────────────────────────────────
  // findOne
  // ──────────────────────────────────────────────
  describe('findOne', () => {
    it('존재하는 id로 신고를 반환한다', async () => {
      mockReportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getOne.mockResolvedValue(mockReport);

      const result = await service.findOne('report-uuid');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('report.id = :id', {
        id: 'report-uuid',
      });
      expect(result).toEqual(mockReport);
    });

    it('존재하지 않는 id면 NotFoundException을 던진다', async () => {
      mockReportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        new NotFoundException('신고를 찾을 수 없습니다.'),
      );
    });

    it('likeCount, commentCount를 loadRelationCountAndMap으로 추가한다', async () => {
      mockReportRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getOne.mockResolvedValue(mockReport);

      await service.findOne('report-uuid');

      expect(mockQueryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith(
        'report.likeCount',
        'marker.likes',
      );
      expect(mockQueryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith(
        'report.commentCount',
        'marker.comments',
      );
    });
  });

  // ──────────────────────────────────────────────
  // update
  // ──────────────────────────────────────────────
  describe('update', () => {
    const updateDto: UpdateReportDto = {
      description: '수정된 설명입니다.',
      hazardLevel: HazardLevel.MEDIUM,
    };

    it('본인 신고를 정상적으로 수정한다', async () => {
      mockReportRepository.findOne.mockResolvedValue({ ...mockReport });
      mockReportRepository.save.mockResolvedValue(undefined);
      const updatedReport = { ...mockReport, ...updateDto };
      mockQueryBuilder.getOneOrFail.mockResolvedValue(updatedReport);

      const result = await service.update(
        'report-uuid',
        'user-uuid',
        updateDto,
      );

      expect(mockReportRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'report-uuid' },
      });
      expect(mockReportRepository.save).toHaveBeenCalled();
      expect(mockQueryBuilder.getOneOrFail).toHaveBeenCalled();
      expect(result.description).toBe(updateDto.description);
      expect(result.hazardLevel).toBe(updateDto.hazardLevel);
    });

    it('dto에 일부 필드만 있어도 해당 필드만 수정한다', async () => {
      mockReportRepository.findOne.mockResolvedValue({ ...mockReport });
      const partialDto: UpdateReportDto = { hazardType: '화재위험' };
      mockReportRepository.save.mockResolvedValue(undefined);
      mockQueryBuilder.getOneOrFail.mockResolvedValue({
        ...mockReport,
        hazardType: '화재위험',
      });

      const result = await service.update(
        'report-uuid',
        'user-uuid',
        partialDto,
      );

      expect(result.hazardType).toBe('화재위험');
    });

    it('존재하지 않는 신고면 NotFoundException을 던진다', async () => {
      mockReportRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', 'user-uuid', updateDto),
      ).rejects.toThrow(new NotFoundException('신고를 찾을 수 없습니다.'));
    });

    it('본인 신고가 아니면 ForbiddenException을 던진다', async () => {
      mockReportRepository.findOne.mockResolvedValue({
        ...mockReport,
        userId: 'other-user-uuid',
      });

      await expect(
        service.update('report-uuid', 'user-uuid', updateDto),
      ).rejects.toThrow(
        new ForbiddenException('본인 신고만 수정할 수 있습니다.'),
      );
    });
  });

  // ──────────────────────────────────────────────
  // remove
  // ──────────────────────────────────────────────
  describe('remove', () => {
    it('본인 신고를 정상적으로 삭제한다', async () => {
      mockReportRepository.findOne.mockResolvedValue({ ...mockReport });
      mockReportRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('report-uuid', 'user-uuid');

      expect(mockReportRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'report-uuid' },
      });
      expect(mockReportRepository.delete).toHaveBeenCalledWith('report-uuid');
      expect(result).toBeUndefined();
    });

    it('존재하지 않는 신고면 NotFoundException을 던진다', async () => {
      mockReportRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent-id', 'user-uuid'),
      ).rejects.toThrow(new NotFoundException('신고를 찾을 수 없습니다.'));
    });

    it('본인 신고가 아니면 ForbiddenException을 던진다', async () => {
      mockReportRepository.findOne.mockResolvedValue({
        ...mockReport,
        userId: 'other-user-uuid',
      });

      await expect(service.remove('report-uuid', 'user-uuid')).rejects.toThrow(
        new ForbiddenException('본인 신고만 삭제할 수 있습니다.'),
      );

      expect(mockReportRepository.delete).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // findByUser
  // ──────────────────────────────────────────────
  describe('findByUser', () => {
    it('유저의 신고 목록을 최신순으로 반환한다', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockReport]);

      const result = await service.findByUser('user-uuid');

      expect(mockReportRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'report.marker',
        'marker',
      );
      expect(mockQueryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith(
        'report.likeCount',
        'marker.likes',
      );
      expect(mockQueryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith(
        'report.commentCount',
        'marker.comments',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'report.userId = :userId',
        { userId: 'user-uuid' },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'report.createdAt',
        'DESC',
      );
      expect(result).toEqual([mockReport]);
    });

    it('신고가 없는 유저는 빈 배열을 반환한다', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.findByUser('user-uuid');

      expect(result).toEqual([]);
    });
  });
});
