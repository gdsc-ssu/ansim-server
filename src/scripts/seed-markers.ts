import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { databaseConfig } from '../database.config';
import { HazardLevel } from '../common/enums/hazard.enum';
import { Marker, MarkerSource } from '../marker/entities/marker.entity';
import { SafetyMungoReport } from '../safety-mungo-report/entities/safety-mungo-report.entity';

const BATCH_SIZE = 100;

const dataSource = new DataSource({
  ...databaseConfig,
  entities: ['src/**/*.entity.ts'],
});

interface RawReport {
  externalReportId: string;
  externalId: string | null;
  spotName: string | null;
  category: string | null;
  description: string | null;
  origin: string | null;
  occurenceDate: string | null;
  syncedAt: string | null;
}

interface RawMarker {
  externalReportId: string;
  latitude: number;
  longitude: number;
  hazardType: string;
  hazardLevel: string | null;
}

async function* streamJsonLines<T>(filePath: string): AsyncGenerator<T> {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  let partial = '';
  for await (const chunk of stream) {
    const lines = (partial + (chunk as string)).split('\n');
    partial = lines.pop()!;
    for (const line of lines) {
      const trimmed = line.replace(/\r$/, '').trim();
      if (!trimmed || trimmed === '[' || trimmed === ']') continue;
      const cleaned = trimmed.endsWith(',') ? trimmed.slice(0, -1) : trimmed;
      yield JSON.parse(cleaned) as T;
    }
  }
  if (partial.trim() && partial.trim() !== ']') {
    const trimmed = partial.replace(/\r$/, '').trim();
    const cleaned = trimmed.endsWith(',') ? trimmed.slice(0, -1) : trimmed;
    yield JSON.parse(cleaned) as T;
  }
}

async function seed() {
  await dataSource.initialize();
  console.log('DB 연결 완료');

  try {
    const smrRepo = dataSource.getRepository(SafetyMungoReport);
    const markerRepo = dataSource.getRepository(Marker);

    // Pass 1: safety_mungo_reports.json → SafetyMungoReport 배치 삽입
    console.log('\n[1/2] SafetyMungoReport 삽입 중...');
    let smrCount = 0;
    let smrBatch: SafetyMungoReport[] = [];

    for await (const r of streamJsonLines<RawReport>(
      path.resolve(__dirname, 'data/safety_mungo_reports.json'),
    )) {
      smrBatch.push(
        smrRepo.create({
          id: r.externalReportId,
          externalId: r.externalId ?? null,
          spotName: r.spotName ?? null,
          category: r.category ?? null,
          description: r.description ?? null,
          origin: r.origin ?? null,
          occurrenceDate: r.occurenceDate ?? null,
          syncedAt: r.syncedAt ? new Date(r.syncedAt) : new Date(),
        }),
      );

      if (smrBatch.length >= BATCH_SIZE) {
        await smrRepo
          .createQueryBuilder()
          .insert()
          .into(SafetyMungoReport)
          .values(smrBatch)
          .orIgnore()
          .execute();
        smrCount += smrBatch.length;
        smrBatch = [];
        if (smrCount % 1000 === 0) {
          console.log(`  진행: ${smrCount.toLocaleString()}건`);
        }
      }
    }
    if (smrBatch.length > 0) {
      await smrRepo
        .createQueryBuilder()
        .insert()
        .into(SafetyMungoReport)
        .values(smrBatch)
        .orIgnore()
        .execute();
      smrCount += smrBatch.length;
    }
    console.log(`  완료: ${smrCount.toLocaleString()}건 처리`);

    // Pass 2: marker.json → Marker 배치 삽입
    console.log('\n[2/2] Marker 삽입 중...');
    let markerCount = 0;
    let markerBatch: Marker[] = [];

    for await (const m of streamJsonLines<RawMarker>(
      path.resolve(__dirname, 'data/marker.json'),
    )) {
      markerBatch.push(
        markerRepo.create({
          safetyMungoReportId: m.externalReportId,
          source: MarkerSource.SAFETY_MUNGO,
          latitude: m.latitude,
          longitude: m.longitude,
          location: {
            type: 'Point',
            coordinates: [m.longitude, m.latitude],
          },
          hazardType: m.hazardType,
          hazardLevel: m.hazardLevel as HazardLevel | null,
        }),
      );

      if (markerBatch.length >= BATCH_SIZE) {
        await markerRepo
          .createQueryBuilder()
          .insert()
          .into(Marker)
          .values(markerBatch)
          .orIgnore()
          .execute();
        markerCount += markerBatch.length;
        markerBatch = [];
        if (markerCount % 1000 === 0) {
          console.log(`  진행: ${markerCount.toLocaleString()}건`);
        }
      }
    }
    if (markerBatch.length > 0) {
      await markerRepo
        .createQueryBuilder()
        .insert()
        .into(Marker)
        .values(markerBatch)
        .orIgnore()
        .execute();
      markerCount += markerBatch.length;
    }
    console.log(`  완료: ${markerCount.toLocaleString()}건 처리`);

    console.log('\n시드 완료');
  } catch (err) {
    console.error('시드 실패:', err);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

void seed();
