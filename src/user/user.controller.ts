import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserRequestDto, CreateUserResponseDto } from './models';
import { PointsService } from './points.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService, private pointsService: PointsService) {}

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

  @Get('/points/:id')
  async getUserPoints(@Param('id') id: string) {
    return this.pointsService.getPointsById(id);
  }

  @Post('/points/:id')
  async addUserPoints(@Param('id') id: string, @Body('pointsToAdd') pointsToAdd: number) {
    return this.pointsService.addPointsById(id, pointsToAdd);
  }

  @Get('/points')
  async getAllUsersSortedByPoints() {
    return this.pointsService.getAllUsersSortedByPoints();
  }
}