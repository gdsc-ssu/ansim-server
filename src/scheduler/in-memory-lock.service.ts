import { Injectable } from '@nestjs/common';
import { DistributedLock } from './interfaces/distributed-lock.interface';

@Injectable()
export class InMemoryLockService implements DistributedLock {
  private readonly locks = new Set<string>();

  tryAcquire(key: string): Promise<boolean> {
    if (this.locks.has(key)) {
      return Promise.resolve(false);
    }
    this.locks.add(key);
    return Promise.resolve(true);
  }

  release(key: string): Promise<void> {
    this.locks.delete(key);
    return Promise.resolve();
  }
}
