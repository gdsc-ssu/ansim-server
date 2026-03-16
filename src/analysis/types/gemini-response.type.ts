export const HAZARD_TYPES = [
  'FIRE',
  'FLOOD',
  'LANDSLIDE',
  'SINKHOLE',
  'ROAD_DAMAGE',
  'COLLAPSE',
  'BUILDING_DAMAGE',
  'CHEMICAL',
  'TRAFFIC',
  'CONSTRUCTION',
  'OTHER',
  'NONE',
] as const;

export type HazardType = (typeof HAZARD_TYPES)[number];

export type GeminiAnalysisResponse = {
  hazardType: HazardType;
  hazardLevel: 'LOW' | 'MEDIUM' | 'HIGH';
};
