import { ApiProperty } from '@nestjs/swagger';
import { HazardLevel, HazardType } from '../../common/enums/hazard.enum';

export class AnalysisResultDto {
  @ApiProperty({
    description: '위험 유형',
    enum: HazardType,
    example: HazardType.SINKHOLE,
  })
  hazardType: HazardType;

  @ApiProperty({
    description: '위험 정도',
    enum: HazardLevel,
    example: HazardLevel.HIGH,
  })
  hazardLevel: HazardLevel;
}
