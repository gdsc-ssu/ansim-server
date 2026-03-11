import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({ example: '로그아웃 되었습니다.' })
  message: string;
}
