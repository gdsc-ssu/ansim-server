import { Inject, Injectable, Logger } from '@nestjs/common';
import type { DistributedLock } from './interfaces/distributed-lock.interface';
import { DISTRIBUTED_LOCK } from './scheduler.constants';

@Injectable()
export class DistributedCronService {
  private readonly logger = new Logger(DistributedCronService.name);

  constructor(
    @Inject(DISTRIBUTED_LOCK)
    private readonly lock: DistributedLock,
  ) {}

  async runWithLock(
    taskName: string,
    task: () => Promise<void>,
  ): Promise<void> {
    const acquired = await this.lock.tryAcquire(taskName);
    if (!acquired) {
      this.logger.debug(`Skipping task "${taskName}": lock not acquired`);
      return;
    }

    try {
      this.logger.log(`Running task "${taskName}"`);
      await task();
      this.logger.log(`Task "${taskName}" completed`);
    } catch (error) {
      this.logger.error(
        `Task "${taskName}" failed`,
        error instanceof Error ? error.stack : error,
      );
    } finally {
      await this.lock.release(taskName);
    }
  }
}
