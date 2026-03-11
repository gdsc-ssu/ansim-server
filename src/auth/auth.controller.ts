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
  ApiOperation,
  ApiResponse,
  ApiTags,
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
  async googleLogin(
    @Body() dto: GoogleLoginDto,
  ): Promise<AuthTokenResponseDto> {
    return this.authService.googleLogin(dto.idToken);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Access Token 재발급' })
  @ApiResponse({ status: 200, type: AuthTokenResponseDto })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokenResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, type: LogoutResponseDto })
  logout(): LogoutResponseDto {
    return { message: '로그아웃 되었습니다.' };
  }
}
