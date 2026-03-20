import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseConfig } from '../database.config';
import { HazardLevel, HazardType } from '../common/enums/hazard.enum';
import { User } from '../user/entities/user.entity';
import { Report } from '../report/entities/report.entity';
import { Marker, MarkerSource } from '../marker/entities/marker.entity';

const dataSource = new DataSource({
  ...databaseConfig,
  entities: ['src/**/*.entity.ts'],
});

interface SeedMarker {
  hazardType: HazardType;
  hazardLevel: HazardLevel;
  description: string;
  latitude: number;
  longitude: number;
}

// 숭실대 중심(37.4964, 126.9572) 주변 좌표
const SEED_DATA: SeedMarker[] = [
  {
    hazardType: HazardType.ROAD_DAMAGE,
    hazardLevel: HazardLevel.HIGH,
    description: '도로 포트홀이 크게 발생하여 차량 통행에 위험',
    latitude: 37.4971,
    longitude: 126.9568,
  },
  {
    hazardType: HazardType.OTHER,
    hazardLevel: HazardLevel.MEDIUM,
    description: '가로등 불빛이 꺼져 야간 보행이 위험',
    latitude: 37.4955,
    longitude: 126.9583,
  },
  {
    hazardType: HazardType.ROAD_DAMAGE,
    hazardLevel: HazardLevel.LOW,
    description: '보도블록이 들떠 있어 보행 시 걸림 위험',
    latitude: 37.4978,
    longitude: 126.9555,
  },
  {
    hazardType: HazardType.CONSTRUCTION,
    hazardLevel: HazardLevel.HIGH,
    description: '건물 철거 공사 중 안전 펜스 미설치',
    latitude: 37.4948,
    longitude: 126.959,
  },
  {
    hazardType: HazardType.FLOOD,
    hazardLevel: HazardLevel.HIGH,
    description: '배수로 막혀 폭우 시 침수 반복 발생',
    latitude: 37.496,
    longitude: 126.9545,
  },
  {
    hazardType: HazardType.ROAD_DAMAGE,
    hazardLevel: HazardLevel.MEDIUM,
    description: '교차로 신호등이 간헐적으로 작동하지 않음',
    latitude: 37.4983,
    longitude: 126.9578,
  },
  {
    hazardType: HazardType.ROAD_DAMAGE,
    hazardLevel: HazardLevel.MEDIUM,
    description: '사고로 인한 가드레일 파손 방치',
    latitude: 37.4942,
    longitude: 126.9562,
  },
  {
    hazardType: HazardType.LANDSLIDE,
    hazardLevel: HazardLevel.HIGH,
    description: '절개지 암석이 불안정하여 낙석 위험',
    latitude: 37.4968,
    longitude: 126.9598,
  },
  {
    hazardType: HazardType.ROAD_DAMAGE,
    hazardLevel: HazardLevel.LOW,
    description: '낙엽이 쌓여 비올 때 차량 미끄러짐 주의',
    latitude: 37.499,
    longitude: 126.956,
  },
  {
    hazardType: HazardType.OTHER,
    hazardLevel: HazardLevel.LOW,
    description: '소방차 진입로에 불법 주정차 빈번',
    latitude: 37.4952,
    longitude: 126.9575,
  },
];

async function seed() {
  await dataSource.initialize();
  console.log('DB 연결 완료');

  await dataSource.transaction(async (manager) => {
    // 시드 전용 유저 (upsert)
    const userRepo = manager.getRepository(User);
    let user = await userRepo.findOneBy({ googleId: 'seed-user-google-id' });
    if (!user) {
      user = await userRepo.save(
        userRepo.create({
          googleId: 'seed-user-google-id',
          email: 'seed@example.com',
          name: 'Seed User',
        }),
      );
    }

    const reportRepo = manager.getRepository(Report);
    const markerRepo = manager.getRepository(Marker);

    for (const item of SEED_DATA) {
      const report = await reportRepo.save(
        reportRepo.create({
          userId: user.id,
          hazardType: item.hazardType,
          hazardLevel: item.hazardLevel,
          description: item.description,
        }),
      );

      await markerRepo.save(
        markerRepo.create({
          reportId: report.id,
          source: MarkerSource.REPORT,
          latitude: item.latitude,
          longitude: item.longitude,
          location: {
            type: 'Point',
            coordinates: [item.longitude, item.latitude],
          },
          hazardType: item.hazardType,
          hazardLevel: item.hazardLevel,
        }),
      );

      console.log(`  생성: [${item.hazardLevel}] ${item.hazardType}`);
    }

    console.log(`\n시드 완료: ${SEED_DATA.length}건의 Marker 생성`);
  });

  await dataSource.destroy();
}

void seed();
