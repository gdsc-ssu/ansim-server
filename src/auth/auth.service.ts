import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { UserService } from '../user/user.service';
import { JwtPayload } from './strategies/jwt.strategy';
import type { StringValue } from 'ms';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {
    this.googleClient = new OAuth2Client(
      configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async googleLogin(idToken: string) {
    const ticket = await this.googleClient
      .verifyIdToken({
        idToken,
        audience: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      })
      .catch(() => {
        throw new UnauthorizedException('유효하지 않은 Google 토큰입니다.');
      });

    const googlePayload = ticket.getPayload();
    if (!googlePayload || !googlePayload.sub) {
      throw new UnauthorizedException('유효하지 않은 Google 토큰입니다.');
    }

    const user = await this.userService.findOrCreate({
      googleId: googlePayload.sub,
      email: googlePayload.email ?? '',
      name: googlePayload.name,
      profileImage: googlePayload.picture,
    });

    return this.issueTokens(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    const payload = await this.jwtService
      .verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      })
      .catch(() => {
        throw new UnauthorizedException('Refresh Token이 만료되었습니다.');
      });

    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('유효하지 않은 사용자입니다.');
    }

    return this.issueTokens(user.id, user.email);
  }

  private issueTokens(userId: string, email: string) {
    const jwtPayload: JwtPayload = { sub: userId, email };

    const atExpiry =
      this.configService.getOrThrow<StringValue>('JWT_EXPIRES_IN');
    const rtExpiry = this.configService.getOrThrow<StringValue>(
      'JWT_REFRESH_EXPIRES_IN',
    );

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: atExpiry,
    });

    const refreshToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: rtExpiry,
    });

    return { accessToken, refreshToken };
  }
}
