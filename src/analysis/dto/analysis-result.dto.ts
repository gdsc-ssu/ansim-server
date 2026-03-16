import { ApiProperty } from '@nestjs/swagger';
import { HazardLevel } from '../../report/entities/report.entity';

export class AnalysisResultDto {
  @ApiProperty({
    description: '위험 유형',
    example: 'SINKHOLE',
  })
  hazardType: string;

  @ApiProperty({
    description: '위험 정도',
    enum: HazardLevel,
    example: HazardLevel.HIGH,
  })
  hazardLevel: HazardLevel;
}
