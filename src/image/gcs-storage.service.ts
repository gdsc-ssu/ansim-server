import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import * as crypto from 'crypto';
import * as path from 'path';

export interface SignedUrlResult {
  signedUrl: string;
  publicUrl: string;
}

@Injectable()
export class GcsStorageService implements OnModuleInit {
  private storage: Storage;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.bucketName = this.configService.getOrThrow<string>('GCS_BUCKET_NAME');
    const projectId = this.configService.getOrThrow<string>('GCP_PROJECT_ID');
    const keyFilePath =
      this.configService.getOrThrow<string>('GCS_KEY_FILE_PATH');

    this.storage = new Storage({ projectId, keyFilename: keyFilePath });
  }

  async generateSignedUrl(
    fileName: string,
    contentType: string,
    fileSize: number,
  ): Promise<SignedUrlResult> {
    const ext = path.extname(fileName);
    const objectKey = `images/${crypto.randomUUID()}${ext}`;

    const expirationMinutes =
      this.configService.get<number>('GCS_SIGNED_URL_EXPIRATION') ?? 15;

    const [signedUrl] = await this.storage
      .bucket(this.bucketName)
      .file(objectKey)
      .getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + expirationMinutes * 60 * 1000,
        contentType,
        extensionHeaders: {
          'x-goog-content-length-range': `0,${fileSize}`,
        },
      });

    const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${objectKey}`;

    return { signedUrl, publicUrl };
  }

  async fileExists(objectKey: string): Promise<boolean> {
    const [exists] = await this.storage
      .bucket(this.bucketName)
      .file(objectKey)
      .exists();
    return exists;
  }
}
