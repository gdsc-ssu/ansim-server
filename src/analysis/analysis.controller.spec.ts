import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { HazardLevel } from '../report/entities/report.entity';

describe('AnalysisController', () => {
  let controller: AnalysisController;
  let service: AnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [
        {
          provide: AnalysisService,
          useValue: { analyze: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AnalysisController>(AnalysisController);
    service = module.get<AnalysisService>(AnalysisService);
  });

  describe('analyze()', () => {
    it('서비스 결과를 그대로 반환한다', async () => {
      const dto = {
        imageUrls: ['https://storage.googleapis.com/bucket/images/test.jpg'],
      };
      const expected = { hazardType: 'FIRE', hazardLevel: HazardLevel.HIGH };

      const spy = jest.spyOn(service, 'analyze').mockResolvedValue(expected);

      expect(await controller.analyze(dto)).toEqual(expected);
      expect(spy).toHaveBeenCalledWith(dto.imageUrls);
    });

    it('서비스가 예외를 던지면 그대로 전파한다', async () => {
      const dto = {
        imageUrls: ['https://example.com/image.jpg'],
      };

      jest
        .spyOn(service, 'analyze')
        .mockRejectedValue(new BadRequestException());

      await expect(controller.analyze(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
