import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

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
}
