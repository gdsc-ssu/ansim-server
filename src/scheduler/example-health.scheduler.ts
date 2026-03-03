import { Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { DistributedCronService } from './distributed-cron.service';

@Injectable()
export class ExampleHealthScheduler {
  private readonly logger = new Logger(ExampleHealthScheduler.name);

  constructor(private readonly cronService: DistributedCronService) {}

  // @Cron(CronExpression.EVERY_MINUTE)
  async handleHealthCheck(): Promise<void> {
    await this.cronService.runWithLock('health-check', () => {
      const rss = process.memoryUsage().rss / 1024 / 1024;
      this.logger.log(
        `RSS: ${rss.toFixed(2)} MB | Uptime: ${process.uptime().toFixed(0)}s`,
      );
      return Promise.resolve();
    });
  }
}
