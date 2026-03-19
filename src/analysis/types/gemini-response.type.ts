import { HazardType } from '../../common/enums/hazard.enum';

export const HAZARD_TYPES = Object.values(HazardType);

/** Gemini AI 분석 시에만 사용되는 NONE 포함 타입 */
export type GeminiHazardType = HazardType | 'NONE';

export type GeminiAnalysisResponse = {
  hazardType: GeminiHazardType;
  hazardLevel: 'LOW' | 'MEDIUM' | 'HIGH';
};
