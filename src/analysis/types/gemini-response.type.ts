export type HazardType =
  | 'FIRE'
  | 'FLOOD'
  | 'LANDSLIDE'
  | 'SINKHOLE'
  | 'ROAD_DAMAGE'
  | 'COLLAPSE'
  | 'BUILDING_DAMAGE'
  | 'CHEMICAL'
  | 'TRAFFIC'
  | 'CONSTRUCTION'
  | 'OTHER'
  | 'NONE';

export type GeminiAnalysisResponse = {
  hazardType: HazardType;
  hazardLevel: 'LOW' | 'MEDIUM' | 'HIGH';
};
