import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AnalysisService } from './analysis.service';

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({}),
  })),
}));

const GCS_URL = 'https://storage.googleapis.com/test-bucket/images/test.jpg';

const mockFetchResponse = (ok = true) =>
  Promise.resolve({
    ok,
    arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('image')),
    headers: { get: jest.fn().mockReturnValue('image/jpeg') },
  });

const mockGeminiResponse = (json: object) => ({
  response: { text: jest.fn().mockReturnValue(JSON.stringify(json)) },
});

describe('AnalysisService', () => {
  let service: AnalysisService;
  let mockGenerateContent: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              if (key === 'GEMINI_API_KEY') return 'test-api-key';
              if (key === 'GEMINI_MODEL') return 'gemini-2.5-flash';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AnalysisService>(AnalysisService);

    // onModuleInit이 외부 SDK를 초기화하므로, private model을 직접 교체
    mockGenerateContent = jest.fn();
    Object.assign(service, { model: { generateContent: mockGenerateContent } });
  });

  describe('URL 검증', () => {
    it('GCS URL이면 통과한다', async () => {
      global.fetch = jest.fn().mockImplementation(() => mockFetchResponse());
      mockGenerateContent.mockResolvedValue(
        mockGeminiResponse({ hazardType: 'FIRE', hazardLevel: 'HIGH' }),
      );

      const result = await service.analyze([GCS_URL]);

      expect(result).toEqual({ hazardType: 'FIRE', hazardLevel: 'HIGH' });
    });

    it('외부 URL이면 BadRequestException을 던진다', async () => {
      await expect(
        service.analyze(['https://example.com/image.jpg']),
      ).rejects.toThrow(BadRequestException);
    });

    it('GCS + 외부 URL 혼합이면 BadRequestException을 던진다', async () => {
      await expect(
        service.analyze([GCS_URL, 'https://example.com/image.jpg']),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('이미지 수 제한', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockImplementation(() => mockFetchResponse());
      mockGenerateContent.mockResolvedValue(
        mockGeminiResponse({ hazardType: 'FIRE', hazardLevel: 'HIGH' }),
      );
    });

    it('이미지 1장이면 fetch를 1번 호출한다', async () => {
      await service.analyze([GCS_URL]);

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('이미지 5장이면 fetch를 5번 호출한다', async () => {
      await service.analyze(Array<string>(5).fill(GCS_URL));

      expect(global.fetch).toHaveBeenCalledTimes(5);
    });

    it('이미지 6장 이상이면 fetch를 5번만 호출한다', async () => {
      await service.analyze(Array<string>(6).fill(GCS_URL));

      expect(global.fetch).toHaveBeenCalledTimes(5);
    });
  });

  describe('fetch 실패', () => {
    it('fetch 자체가 throw하면 BadRequestException을 던진다', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('network error'));

      await expect(service.analyze([GCS_URL])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('fetch 응답이 ok=false면 BadRequestException을 던진다', async () => {
      global.fetch = jest
        .fn()
        .mockImplementation(() => mockFetchResponse(false));

      await expect(service.analyze([GCS_URL])).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Gemini 응답 파싱', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockImplementation(() => mockFetchResponse());
    });

    it('정상 JSON 응답이면 결과를 반환한다', async () => {
      mockGenerateContent.mockResolvedValue(
        mockGeminiResponse({ hazardType: 'SINKHOLE', hazardLevel: 'MEDIUM' }),
      );

      const result = await service.analyze([GCS_URL]);

      expect(result).toEqual({ hazardType: 'SINKHOLE', hazardLevel: 'MEDIUM' });
    });

    it('마크다운 코드블록으로 감싸진 응답도 정상 파싱한다', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: jest
            .fn()
            .mockReturnValue(
              '```json\n{"hazardType":"FIRE","hazardLevel":"HIGH"}\n```',
            ),
        },
      });

      const result = await service.analyze([GCS_URL]);

      expect(result).toEqual({ hazardType: 'FIRE', hazardLevel: 'HIGH' });
    });

    it('hazardType이 NONE이면 UnprocessableEntityException을 던진다', async () => {
      mockGenerateContent.mockResolvedValue(
        mockGeminiResponse({ hazardType: 'NONE', hazardLevel: 'LOW' }),
      );

      await expect(service.analyze([GCS_URL])).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('JSON 파싱 1회 실패 후 성공하면 결과를 반환한다', async () => {
      mockGenerateContent
        .mockResolvedValueOnce({
          response: { text: jest.fn().mockReturnValue('invalid json') },
        })
        .mockResolvedValueOnce(
          mockGeminiResponse({ hazardType: 'FLOOD', hazardLevel: 'HIGH' }),
        );

      const result = await service.analyze([GCS_URL]);

      expect(result).toEqual({ hazardType: 'FLOOD', hazardLevel: 'HIGH' });
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('JSON 파싱 2회 모두 실패하면 InternalServerErrorException을 던진다', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: jest.fn().mockReturnValue('invalid json') },
      });

      await expect(service.analyze([GCS_URL])).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });
  });
});
