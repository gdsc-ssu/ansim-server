import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

interface GoogleUserPayload {
  googleId: string;
  email: string;
  name?: string;
  profileImage?: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOneBy({ googleId });
  }

  async findOrCreate(payload: GoogleUserPayload): Promise<User> {
    const existing = await this.findByGoogleId(payload.googleId);
    if (existing) {
      return existing;
    }
    const user = this.userRepository.create({
      googleId: payload.googleId,
      email: payload.email,
      name: payload.name,
      profileImage: payload.profileImage,
    });
    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }
}
