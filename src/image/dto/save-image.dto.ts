import { IsIn, IsInt, IsUUID, IsUrl, Max, Min } from 'class-validator';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export class SaveImageDto {
  @IsUUID()
  reportId: string;

  @IsUrl()
  url: string;

  @IsIn(ALLOWED_MIME_TYPES)
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024) // 10MB
  size: number;
}
