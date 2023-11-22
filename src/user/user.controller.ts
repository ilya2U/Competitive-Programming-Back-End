import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserRequestDto, CreateUserResponseDto } from './models';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(
    @Body() payload: CreateUserRequestDto,
  ): Promise<CreateUserResponseDto> {
    try {
      const { avatar, hash, username } = payload;
      return this.userService.createUser(username, hash, avatar);
    } catch (e: unknown) {
      throw new BadRequestException();
    }
  }
}
