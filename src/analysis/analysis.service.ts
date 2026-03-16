import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GCS_URL_PREFIX } from '../image/image.constant';
import { AnalysisResultDto } from './dto';
import { GeminiAnalysisResponse } from './types/gemini-response.type';
import { HazardLevel } from '../report/entities/report.entity';

const MAX_IMAGES = 5;

const SYSTEM_INSTRUCTION = `당신은 공공 안전 위험 분석 전문가입니다.
사용자가 제공한 이미지에서 위험 요소를 식별하고
아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.`;

const USER_PROMPT = `이 이미지에서 위험 요소를 분석하세요.

응답 형식 (JSON만):
{
  "hazardType": "FIRE | FLOOD | LANDSLIDE | SINKHOLE | ROAD_DAMAGE | COLLAPSE | BUILDING_DAMAGE | CHEMICAL | TRAFFIC | CONSTRUCTION | OTHER | NONE",
  "hazardLevel": "LOW | MEDIUM | HIGH"
}

각 유형 판단 기준:
- SINKHOLE: 도로 함몰, 방사형 균열, 맨홀 주변 침하 등 싱크홀 전조 증상
- ROAD_DAMAGE: 포트홀, 도로 균열, 맨홀 뚜껑 파손, 경계석 손상
- BUILDING_DAMAGE: 건물 외벽 균열, 기울음, 외장재 탈락
- COLLAPSE: 구조물이 무너지거나 낙하물 위험이 있는 상태
- NONE: 이미지에서 위험 요소를 찾을 수 없는 경우`;

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
    });
  }

  async analyze(imageUrls: string[]): Promise<AnalysisResultDto> {
    const urls = imageUrls.slice(0, MAX_IMAGES);

    this.validateGcsUrls(urls);

    const imageParts = await this.fetchImagesAsBase64(urls);

    const result = await this.callGeminiWithRetry(imageParts);

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
    const results = await Promise.all(
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

    return results;
  }

  private async callGeminiWithRetry(
    imageParts: { inlineData: { data: string; mimeType: string } }[],
    attempt = 1,
  ): Promise<GeminiAnalysisResponse> {
    try {
      const result = await this.model.generateContent([
        ...imageParts,
        { text: USER_PROMPT },
      ]);

      const raw = result.response.text();
      const match = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
      const text = (match ? match[1] : raw).trim();
      return JSON.parse(text) as GeminiAnalysisResponse;
    } catch (error) {
      if (attempt < 2) {
        this.logger.warn(`Gemini 응답 파싱 실패, 재시도 중... (${error})`);
        return this.callGeminiWithRetry(imageParts, attempt + 1);
      }
      this.logger.error(`Gemini 호출 최종 실패: ${error}`);
      throw new InternalServerErrorException('이미지 분석에 실패했습니다.');
    }
  }
}
