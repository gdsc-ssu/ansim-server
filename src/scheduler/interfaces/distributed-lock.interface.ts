export interface DistributedLock {
  tryAcquire(key: string): Promise<boolean>;
  release(key: string): Promise<void>;
}
