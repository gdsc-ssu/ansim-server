import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DistributedCronService } from './distributed-cron.service';
import { ExampleHealthScheduler } from './example-health.scheduler';
import { InMemoryLockService } from './in-memory-lock.service';
import { DISTRIBUTED_LOCK } from './scheduler.constants';

@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    {
      provide: DISTRIBUTED_LOCK,
      useClass: InMemoryLockService,
    },
    DistributedCronService,
    ExampleHealthScheduler,
  ],
  exports: [DistributedCronService],
})
export class SchedulerModule {}
