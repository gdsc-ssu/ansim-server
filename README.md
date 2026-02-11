# ansim-server

NestJS 백엔드 서버

## 요구사항

- Node.js >= 24.12.0
- pnpm
- Docker & Docker Compose

## Docker Compose로 개발환경 실행

```bash
# 실행 (첫 실행 시 이미지 빌드 포함)
docker compose up --build

# 백그라운드 실행
docker compose up --build -d

# 종료
docker compose down

# 종료 + DB 볼륨 삭제
docker compose down -v
```

실행 후 `http://localhost:3000`으로 접속 가능합니다.

### 구성

| 서비스 | 설명 | 포트 |
|--------|------|------|
| app | NestJS 서버 (watch 모드) | 3000 |
| db | PostgreSQL 17 + PostGIS | 5432 |

### DB 접속 정보

| 항목 | 값 |
|------|-----|
| Host | localhost (로컬) / db (컨테이너 간) |
| Port | 5432 |
| User | ansim |
| Password | ansim |
| Database | ansim |

## 로컬 실행 (Docker 없이)

```bash
pnpm install
pnpm run start:dev
```

`.env.example`을 `.env`로 복사 후 환경변수를 설정하세요.

## 마이그레이션

```bash
# 엔티티 변경사항 기반 마이그레이션 생성
pnpm migration:generate src/migrations/MigrationName

# 빈 마이그레이션 생성
pnpm migration:create src/migrations/MigrationName

# 마이그레이션 실행
pnpm migration:run

# 마지막 마이그레이션 롤백
pnpm migration:revert

# 스키마 전체 삭제
pnpm migration:drop
```

> 개발 환경에서는 `synchronize: true`로 엔티티 변경이 자동 반영됩니다.

## 테스트

```bash
pnpm run test          # 단위 테스트
pnpm run test:e2e      # E2E 테스트
pnpm run test:cov      # 커버리지
```
