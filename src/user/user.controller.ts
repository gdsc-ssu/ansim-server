import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import {
  UserProfileResponseDto,
  UserSettingsDto,
} from './dto/user-profile-response.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  getMyProfile(@Req() req: Request & { user: User }): UserProfileResponseDto {
    const user = req.user;
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      profileImage: user.profileImage ?? null,
      address: user.address ?? null,
      settings: {
        nearbyDangerAlert: user.nearbyDangerAlert,
        emergencyAlert: user.emergencyAlert,
      },
      createdAt: user.createdAt,
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로필 수정 (이름, 프로필 이미지, 주소)' })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async updateMyProfile(
    @Req() req: Request & { user: User },
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    const user = await this.userService.updateProfile(req.user.id, dto);
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      profileImage: user.profileImage ?? null,
      address: user.address ?? null,
      settings: {
        nearbyDangerAlert: user.nearbyDangerAlert,
        emergencyAlert: user.emergencyAlert,
      },
      createdAt: user.createdAt,
    };
  }

  @Patch('me/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '알림 설정 수정' })
  @ApiResponse({ status: 200, type: UserSettingsDto })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  async updateMySettings(
    @Req() req: Request & { user: User },
    @Body() dto: UpdateSettingsDto,
  ): Promise<UserSettingsDto> {
    const user = await this.userService.updateSettings(req.user.id, dto);
    return {
      nearbyDangerAlert: user.nearbyDangerAlert,
      emergencyAlert: user.emergencyAlert,
    };
  }
}
