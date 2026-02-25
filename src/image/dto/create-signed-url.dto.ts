import { IsIn, IsInt, IsString, Max, Min } from 'class-validator';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export class CreateSignedUrlDto {
  @IsString()
  fileName: string;

  @IsIn(ALLOWED_MIME_TYPES)
  contentType: string;

  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024) // 10MB
  fileSize: number;
}
