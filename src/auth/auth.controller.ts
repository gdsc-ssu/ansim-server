import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthTokenResponseDto } from './dto/auth-token-response.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google 로그인' })
  @ApiResponse({ status: 200, type: AuthTokenResponseDto })
  @ApiBadRequestResponse({
    description: '요청 바디 유효성 검증 실패 (idToken 누락 등)',
  })
  @ApiUnauthorizedResponse({ description: '유효하지 않은 Google ID Token' })
  async googleLogin(
    @Body() dto: GoogleLoginDto,
  ): Promise<AuthTokenResponseDto> {
    return this.authService.googleLogin(dto.idToken);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Access Token 재발급' })
  @ApiResponse({ status: 200, type: AuthTokenResponseDto })
  @ApiBadRequestResponse({
    description: '요청 바디 유효성 검증 실패 (refreshToken 누락 등)',
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh Token 만료 또는 유효하지 않은 사용자',
  })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokenResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, type: LogoutResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Authorization 헤더 없음 또는 만료된 Access Token',
  })
  logout(): LogoutResponseDto {
    return { message: '로그아웃 되었습니다.' };
  }
}
