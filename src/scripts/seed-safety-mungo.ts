import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { databaseConfig } from '../database.config';
import { HazardLevel, HazardType } from '../common/enums/hazard.enum';
import { Marker, MarkerSource } from '../marker/entities/marker.entity';
import { SafetyMungoReport } from '../safety-mungo-report/entities/safety-mungo-report.entity';

// 한 번에 DB에 삽입할 레코드 수. 너무 크면 메모리 압박, 너무 작으면 왕복 횟수 증가
const BATCH_SIZE = 100;

const dataSource = new DataSource({
  ...databaseConfig,
  entities: ['src/**/*.entity.ts'],
  // seed 스크립트는 스키마 변경을 하지 않음 — 마이그레이션이 담당
  synchronize: false,
});

// safety_mungo_reports.json 한 줄의 스키마
interface RawReport {
  externalReportId: string;
  externalId: string | null;
  spotName: string | null;
  category: string | null;
  description: string | null;
  origin: string | null;
  // 원본 JSON 필드명이 occurenceDate(소스 데이터 오타)
  // 엔티티 필드(occurrenceDate, 올바른 철자)와 혼동 주의
  occurenceDate: string | null;
  syncedAt: string | null;
}

// marker.json 한 줄의 스키마
interface RawMarker {
  externalReportId: string;
  latitude: number;
  longitude: number;
  hazardType: string;
  hazardLevel: string | null;
}

// 안전신문고 한국어 카테고리 → HazardType enum 매핑
// DB의 hazardType 컬럼은 enum 타입이므로 변환 필수
const HAZARD_TYPE_MAP: Record<string, HazardType> = {
  '도로, 시설물 파손 및 고장': HazardType.ROAD_DAMAGE,
  '기타 안전·환경 위험요소': HazardType.OTHER,
  '계절별 집중신고': HazardType.OTHER,
  '사업장 안전(건설·공사현장 등)': HazardType.CONSTRUCTION,
  소방안전: HazardType.FIRE,
  대기오염: HazardType.CHEMICAL,
  수질오염: HazardType.CHEMICAL,
  '(구)쓰레기, 폐기물, 유독물': HazardType.CHEMICAL,
  '(구)하천·계곡 내 불법시설': HazardType.OTHER,
  '고층 건물 화재 안전': HazardType.FIRE,
  '(구)지하수 미등록 시설·방치공': HazardType.OTHER,
};

function toHazardType(raw: string | null): HazardType {
  if (!raw) return HazardType.OTHER;
  return HAZARD_TYPE_MAP[raw] ?? HazardType.OTHER;
}

/**
 * 대용량 JSON 배열 파일을 한 줄씩 스트리밍으로 파싱하는 제너레이터.
 *
 * 배경: 파일 크기가 1GB를 초과하므로 fs.readFileSync 사용 불가 (Node.js 문자열 한계 ~536MB).
 * 해결책: fs.createReadStream으로 청크 단위 읽기 → 줄 단위 분리 → JSON 파싱.
 *
 * CR/LF 처리: readline의 crlfDelay는 CR 단독 줄 끝을 처리하지 못해 파싱 오류 발생.
 * 대신 chunk.split('\n') + replace(/\r$/, '') 패턴으로 직접 처리.
 */
async function* streamJsonLines<T>(filePath: string): AsyncGenerator<T> {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  // 청크 경계에서 잘린 불완전한 줄을 다음 청크와 이어붙이기 위한 버퍼
  let partial = '';
  for await (const chunk of stream) {
    const lines = (partial + (chunk as string)).split('\n');
    // 마지막 요소는 다음 청크와 이어붙여야 하는 불완전한 줄
    partial = lines.pop()!;
    for (const line of lines) {
      const trimmed = line.replace(/\r$/, '').trim();
      // JSON 배열의 [ ] 구분자 및 빈 줄 건너뜀
      if (!trimmed || trimmed === '[' || trimmed === ']') continue;
      // 배열 원소 뒤에 붙는 후행 쉼표 제거
      const cleaned = trimmed.endsWith(',') ? trimmed.slice(0, -1) : trimmed;
      yield JSON.parse(cleaned) as T;
    }
  }
  // 파일 끝에 남은 불완전한 줄 처리
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

    // ── Pass 1: SafetyMungoReport 삽입 ──────────────────────────────────────
    // safety_mungo_reports.json의 각 레코드를 SafetyMungoReport 테이블에 삽입.
    // orIgnore()로 중복 실행 시 충돌 무시 → 멱등성 보장.
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
    // 배치 크기 미만으로 남은 마지막 레코드 처리
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

    // ── Pass 2: Marker 삽입 ─────────────────────────────────────────────────
    // marker.json의 각 레코드를 Marker 테이블에 삽입.
    // safetyMungoReportId = externalReportId로 Pass 1의 SafetyMungoReport와 연결.
    // location은 PostGIS Point 타입 (coordinates 순서: [longitude, latitude]).
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
          // 원본 JSON의 한국어 카테고리를 DB enum 값으로 변환
          hazardType: toHazardType(m.hazardType),
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
    // 배치 크기 미만으로 남은 마지막 레코드 처리
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
