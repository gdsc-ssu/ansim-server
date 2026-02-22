import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { UserService } from '../user/user.service';
import { JwtPayload } from './strategies/jwt.strategy';

type JwtSignOptionsWithStringExpiry = Omit<JwtSignOptions, 'expiresIn'> & {
  expiresIn: string;
};

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;
  private readonly googleClientId: string;
  private readonly atOptions: JwtSignOptionsWithStringExpiry;
  private readonly rtOptions: JwtSignOptionsWithStringExpiry;

  constructor(
    configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {
    this.googleClientId = configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    this.googleClient = new OAuth2Client(this.googleClientId);

    this.atOptions = {
      secret: configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: configService.getOrThrow<string>('JWT_EXPIRES_IN'),
    };

    this.rtOptions = {
      secret: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    };
  }

  async googleLogin(idToken: string) {
    const ticket = await this.googleClient
      .verifyIdToken({
        idToken,
        audience: this.googleClientId,
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
        secret: this.rtOptions.secret,
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

    const accessToken: string = this.jwtService.sign(
      jwtPayload,
      this.atOptions as JwtSignOptions,
    );
    const refreshToken: string = this.jwtService.sign(
      jwtPayload,
      this.rtOptions as JwtSignOptions,
    );

    return { accessToken, refreshToken };
  }
}
