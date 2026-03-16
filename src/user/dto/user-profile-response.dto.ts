import { ApiProperty } from '@nestjs/swagger';

export class UserSettingsDto {
  @ApiProperty({ description: '근접 위험 알림 활성화 여부' })
  nearbyDangerAlert: boolean;

  @ApiProperty({ description: '긴급 알림 활성화 여부' })
  emergencyAlert: boolean;
}

export class UserProfileResponseDto {
  @ApiProperty({ description: '사용자 ID' })
  id: string;

  @ApiProperty({ description: '이메일' })
  email: string;

  @ApiProperty({ description: '이름', nullable: true })
  name: string | null;

  @ApiProperty({ description: '프로필 이미지 URL', nullable: true })
  profileImage: string | null;

  @ApiProperty({ description: '주소', nullable: true })
  address: string | null;

  @ApiProperty({ description: '알림 설정' })
  settings: UserSettingsDto;

  @ApiProperty({ description: '가입일' })
  createdAt: Date;
}
