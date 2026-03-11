import { ApiProperty } from '@nestjs/swagger';

export class AuthTokenResponseDto {
  @ApiProperty({ description: 'JWT Access Token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT Refresh Token' })
  refreshToken: string;
}
