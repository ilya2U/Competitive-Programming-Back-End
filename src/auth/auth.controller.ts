import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { Jwt, SignInPayload } from './models';
import { AuthGuard } from './auth.guard';
import { User, UserService } from '@/user';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post()
  async signIn(@Body() payload: SignInPayload): Promise<Jwt> {
    try {
      const { hash, username } = payload;
      return this.authService.signIn(username, hash);
    } catch (e: unknown) {
      throw new BadRequestException();
    }
  }

  @UseGuards(AuthGuard)
  @Get('user')
  async getUser(@Headers('Authorization') header: string): Promise<User> {
    const [type, token] = header.split(' ');
    if (type !== 'Bearer') {
      throw new BadRequestException();
    }
    try {
      const decodedJwt = this.jwtService.decode(token);
      return this.userService.findOne({ uuid: decodedJwt.sub as string });
    } catch (e: unknown) {
      throw new BadRequestException();
    }
  }

  @UseGuards(AuthGuard)
  @Get('user/:connId')
  async getUserByConnId(
    @Param('connId') connId: string,
  ): Promise<Pick<User, 'avatar' | 'username'>> {
    const user = await this.userService.findOne({ connId });

    if (user) {
      const { avatar, username } = user;
      return { avatar, username };
    }
  }

  @UseGuards(AuthGuard)
  @Put('user')
  async updateUser(
    @Headers('Authorization') header: string,
    @Body() payload: Partial<User>,
  ): Promise<User> {
    const [type, token] = header.split(' ');
    if (type !== 'Bearer') {
      throw new BadRequestException();
    }
    try {
      const decodedJwt = this.jwtService.decode(token);
      const user = await this.userService.findOne({
        uuid: decodedJwt.sub as string,
      });

      if (!user?.id) {
        throw new NotFoundException();
      }

      return this.userService.updateOne(user.id, payload);
    } catch (e: unknown) {
      throw new BadRequestException();
    }
  }
}
