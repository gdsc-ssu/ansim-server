import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { GCS_URL_PREFIX } from '../image/image.constant';
import { AnalysisResultDto } from './dto';
import {
  GeminiAnalysisResponse,
  HAZARD_TYPES,
} from './types/gemini-response.type';
import { HazardLevel } from '../report/entities/report.entity';

const MAX_IMAGES = 5;

const SYSTEM_INSTRUCTION = `당신은 공공 안전 위험 분석 전문가입니다.
사용자가 제공한 이미지에서 위험 요소를 식별하세요.`;

const USER_PROMPT = `이 이미지에서 위험 요소를 분석하세요.

각 유형 판단 기준:
- SINKHOLE: 도로 함몰, 방사형 균열, 맨홀 주변 침하 등 싱크홀 전조 증상
- ROAD_DAMAGE: 포트홀, 도로 균열, 맨홀 뚜껑 파손, 경계석 손상
- BUILDING_DAMAGE: 건물 외벽 균열, 기울음, 외장재 탈락
- COLLAPSE: 구조물이 무너지거나 낙하물 위험이 있는 상태
- NONE: 이미지에서 위험 요소를 찾을 수 없는 경우`;

const RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    hazardType: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: [...HAZARD_TYPES],
    },
    hazardLevel: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: Object.values(HazardLevel),
    },
  },
  required: ['hazardType', 'hazardLevel'],
};

@Injectable()
export class AnalysisService implements OnModuleInit {
  private readonly logger = new Logger(AnalysisService.name);
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    const modelName = this.configService.getOrThrow<string>('GEMINI_MODEL');
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    });
  }

  async analyze(imageUrls: string[]): Promise<AnalysisResultDto> {
    const urls = imageUrls.slice(0, MAX_IMAGES);

    this.validateGcsUrls(urls);

    const imageParts = await this.fetchImagesAsBase64(urls);

    const result = await this.callGemini(imageParts);

    if (result.hazardType === 'NONE') {
      throw new UnprocessableEntityException(
        '이미지에서 위험 요소를 식별할 수 없습니다.',
      );
    }

    return {
      hazardType: result.hazardType,
      hazardLevel: result.hazardLevel as HazardLevel,
    };
  }

  private validateGcsUrls(urls: string[]): void {
    if (urls.some((url) => !url.startsWith(GCS_URL_PREFIX))) {
      throw new BadRequestException('GCS에 저장된 이미지 URL만 허용됩니다.');
    }
  }

  private async fetchImagesAsBase64(
    urls: string[],
  ): Promise<{ inlineData: { data: string; mimeType: string } }[]> {
    return Promise.all(
      urls.map(async (url) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const buffer = await response.arrayBuffer();
          const mimeType = response.headers.get('content-type') ?? 'image/jpeg';

          return {
            inlineData: {
              data: Buffer.from(buffer).toString('base64'),
              mimeType,
            },
          };
        } catch (error) {
          this.logger.warn(`이미지 fetch 실패 ${url}: ${String(error)}`);
          throw new BadRequestException(`이미지를 가져올 수 없습니다: ${url}`);
        }
      }),
    );
  }

  private async callGemini(
    imageParts: { inlineData: { data: string; mimeType: string } }[],
  ): Promise<GeminiAnalysisResponse> {
    try {
      const result = await this.model.generateContent([
        ...imageParts,
        { text: USER_PROMPT },
      ]);
      return JSON.parse(result.response.text()) as GeminiAnalysisResponse;
    } catch (error) {
      this.logger.error(`Gemini 호출 실패: ${String(error)}`);
      throw new InternalServerErrorException('이미지 분석에 실패했습니다.');
    }
  }
}
