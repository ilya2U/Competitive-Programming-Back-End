import { UserService } from '@/user';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as sha256 from 'sha256';
import { Jwt } from './models';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  /* API methods */

  async signIn(username: string, hash: string): Promise<Jwt> {
    const user = await this.userService.findOne({ username });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user?.hash !== sha256.x2(hash)) {
      throw new UnauthorizedException('Wrong password');
    }
    const payload = { sub: user.uuid, username: user.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
