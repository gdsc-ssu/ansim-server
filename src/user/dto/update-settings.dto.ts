import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: '근접 위험 알림 활성화 여부' })
  @IsOptional()
  @IsBoolean()
  nearbyDangerAlert?: boolean;

  @ApiPropertyOptional({ description: '긴급 알림 활성화 여부' })
  @IsOptional()
  @IsBoolean()
  emergencyAlert?: boolean;
}
