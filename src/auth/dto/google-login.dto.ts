import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google ID Token' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
