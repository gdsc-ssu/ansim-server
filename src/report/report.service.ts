import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto, GetReportsQueryDto, UpdateReportDto } from './dto';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async create(userId: string, dto: CreateReportDto): Promise<Report> {
    const result = await this.reportRepository
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

    const id = result.identifiers[0].id as string;
    return this.findOne(id);
  }

  async findNearby(query: GetReportsQueryDto): Promise<Report[]> {
    const qb = this.reportRepository
      .createQueryBuilder('report')
      .innerJoin('report.marker', 'marker')
      .select([
        'report.id',
        'report.userId',
        'report.hazardType',
        'report.hazardLevel',
        'report.description',
        'report.createdAt',
        'report.updatedAt',
      ])
      .where(
        `ST_DWithin(
          marker.location::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radius
        )`,
        { lng: query.lng, lat: query.lat, radius: query.radius },
      )
      .orderBy('report.createdAt', 'DESC');

    if (query.hazardType) {
      qb.andWhere('report.hazardType = :hazardType', {
        hazardType: query.hazardType,
      });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportRepository
      .createQueryBuilder('report')
      .select([
        'report.id',
        'report.userId',
        'report.hazardType',
        'report.hazardLevel',
        'report.description',
        'report.createdAt',
        'report.updatedAt',
      ])
      .where('report.id = :id', { id })
      .getOne();

    if (!report) throw new NotFoundException('신고를 찾을 수 없습니다.');
    return report;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateReportDto,
  ): Promise<Report> {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) throw new NotFoundException('신고를 찾을 수 없습니다.');
    if (report.userId !== userId)
      throw new ForbiddenException('본인 신고만 수정할 수 있습니다.');

    Object.assign(report, dto);
    await this.reportRepository.save(report);

    return this.reportRepository
      .createQueryBuilder('report')
      .select([
        'report.id',
        'report.userId',
        'report.hazardType',
        'report.hazardLevel',
        'report.description',
        'report.createdAt',
        'report.updatedAt',
      ])
      .where('report.id = :id', { id })
      .getOneOrFail();
  }

  async remove(id: string, userId: string): Promise<void> {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) throw new NotFoundException('신고를 찾을 수 없습니다.');
    if (report.userId !== userId)
      throw new ForbiddenException('본인 신고만 삭제할 수 있습니다.');

    await this.reportRepository.delete(id);
  }

  async findByUser(userId: string): Promise<Report[]> {
    return this.reportRepository
      .createQueryBuilder('report')
      .select([
        'report.id',
        'report.userId',
        'report.hazardType',
        'report.hazardLevel',
        'report.description',
        'report.createdAt',
        'report.updatedAt',
      ])
      .where('report.userId = :userId', { userId })
      .orderBy('report.createdAt', 'DESC')
      .getMany();
  }
}
