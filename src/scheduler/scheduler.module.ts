import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DistributedCronService } from './distributed-cron.service';
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
  ],
  exports: [DistributedCronService],
})
export class SchedulerModule {}
