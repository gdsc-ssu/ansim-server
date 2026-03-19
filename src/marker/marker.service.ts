import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Image } from '../image/entities/image.entity';
import { Report } from '../report/entities/report.entity';
import { Marker, MarkerSource } from './entities/marker.entity';
import { CreateMarkerDto, GetMarkersQueryDto, UpdateMarkerDto } from './dto';

@Injectable()
export class MarkerService {
  constructor(
    @InjectRepository(Marker)
    private readonly markerRepository: Repository<Marker>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateMarkerDto): Promise<Marker> {
    return this.dataSource.transaction(async (manager) => {
      const reportResult = await manager
        .createQueryBuilder()
        .insert()
        .into(Report)
        .values({
          userId,
          hazardType: dto.hazardType,
          hazardLevel: dto.hazardLevel,
          description: dto.description,
          ...(dto.aiRawResult && { aiRawResult: dto.aiRawResult }),
        })
        .returning('id')
        .execute();

      const reportId = reportResult.identifiers[0].id as string;

      if (dto.images?.length) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(Image)
          .values(
            dto.images.map((img) => ({
              reportId,
              url: img.url,
              mimeType: img.mimeType,
              size: img.size,
            })),
          )
          .execute();
      }

      const markerResult = await manager
        .createQueryBuilder()
        .insert()
        .into(Marker)
        .values({
          reportId,
          source: MarkerSource.REPORT,
          latitude: dto.latitude,
          longitude: dto.longitude,
          location: () =>
            `ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)`,
          hazardType: dto.hazardType,
          hazardLevel: dto.hazardLevel,
        })
        .returning('id')
        .execute();

      const markerId = markerResult.identifiers[0].id as string;

      const marker = await manager.findOne(Marker, {
        where: { id: markerId },
        relations: ['report', 'report.images'],
      });
      if (!marker) throw new NotFoundException('마커를 찾을 수 없습니다.');
      return marker;
    });
  }

  async findNearby(query: GetMarkersQueryDto): Promise<Marker[]> {
    const qb = this.markerRepository
      .createQueryBuilder('marker')
      .select([
        'marker.id',
        'marker.source',
        'marker.latitude',
        'marker.longitude',
        'marker.hazardType',
        'marker.hazardLevel',
        'marker.createdAt',
      ])
      .loadRelationCountAndMap('marker.likeCount', 'marker.likes')
      .loadRelationCountAndMap('marker.commentCount', 'marker.comments')
      .where(
        `ST_DWithin(
          marker.location::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radius
        )`,
        { lng: query.lng, lat: query.lat, radius: query.radius },
      )
      .orderBy('marker.createdAt', 'DESC')
      .take(query.limit ?? 100);

    if (query.hazardType) {
      qb.andWhere('marker.hazardType = :hazardType', {
        hazardType: query.hazardType,
      });
    }

    if (query.source) {
      qb.andWhere('marker.source = :source', { source: query.source });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Marker> {
    const marker = await this.markerRepository
      .createQueryBuilder('marker')
      .leftJoin('marker.report', 'report')
      .leftJoin('report.images', 'image')
      .leftJoin('marker.safetyMungoReport', 'safetyMungoReport')
      .select([
        'marker.id',
        'marker.source',
        'marker.latitude',
        'marker.longitude',
        'marker.hazardType',
        'marker.hazardLevel',
        'marker.createdAt',
        'report.id',
        'report.userId',
        'report.description',
        'report.aiRawResult',
        'report.createdAt',
        'report.updatedAt',
        'image.id',
        'image.url',
        'image.mimeType',
        'image.size',
        'image.createdAt',
        'safetyMungoReport.id',
        'safetyMungoReport.spotName',
        'safetyMungoReport.category',
        'safetyMungoReport.description',
        'safetyMungoReport.origin',
        'safetyMungoReport.occurrenceDate',
      ])
      .loadRelationCountAndMap('marker.likeCount', 'marker.likes')
      .loadRelationCountAndMap('marker.commentCount', 'marker.comments')
      .where('marker.id = :id', { id })
      .getOne();

    if (!marker) throw new NotFoundException('마커를 찾을 수 없습니다.');
    return marker;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateMarkerDto,
  ): Promise<Marker> {
    const marker = await this.markerRepository.findOne({
      where: { id },
      relations: ['report'],
    });
    if (!marker) throw new NotFoundException('마커를 찾을 수 없습니다.');
    if (marker.source !== MarkerSource.REPORT) {
      throw new ForbiddenException('사용자 신고 마커만 수정할 수 있습니다.');
    }
    if (!marker.report || marker.report.userId !== userId) {
      throw new ForbiddenException('본인 마커만 수정할 수 있습니다.');
    }

    return this.dataSource.transaction(async (manager) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { description, ...markerUpdates } = dto;

      const promises: Promise<unknown>[] = [];

      if (Object.keys(dto).length > 0) {
        promises.push(manager.update(Report, marker.reportId!, dto));
      }

      if (Object.keys(markerUpdates).length > 0) {
        promises.push(manager.update(Marker, id, markerUpdates));
      }

      await Promise.all(promises);

      const updated = await manager.findOne(Marker, {
        where: { id },
        relations: ['report'],
      });
      if (!updated) throw new NotFoundException('마커를 찾을 수 없습니다.');
      return updated;
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const marker = await this.markerRepository.findOne({
      where: { id },
      relations: ['report'],
    });
    if (!marker) throw new NotFoundException('마커를 찾을 수 없습니다.');
    if (marker.source !== MarkerSource.REPORT) {
      throw new ForbiddenException('사용자 신고 마커만 삭제할 수 있습니다.');
    }
    if (!marker.report || marker.report.userId !== userId) {
      throw new ForbiddenException('본인 마커만 삭제할 수 있습니다.');
    }

    // Report 삭제 → DB CASCADE로 Marker 자동 삭제
    await this.reportRepository.delete(marker.reportId!);
  }
}
