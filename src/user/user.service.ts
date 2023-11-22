import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { TUserDocument, User } from './schemas/user.schema';
import * as sha256 from 'sha256';
import { CreateUserResponseDto } from './models';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private usersRepository: Model<TUserDocument>,
  ) {}

  /* Database methods */

  async findOne(knownData: Partial<User>): Promise<TUserDocument> {
    return await this.usersRepository.findOne(knownData).exec();
  }

  async findById(id: string): Promise<TUserDocument> {
    return await this.usersRepository.findById(id).exec();
  }

  async find(): Promise<TUserDocument[]> {
    return await this.usersRepository.find().exec();
  }

  async updateOne(id: string, $set: Partial<User>): Promise<TUserDocument> {
    return await this.usersRepository.findByIdAndUpdate(id, { $set }).exec();
  }

  /* API methods */

  async createUser(
    username: string,
    hash: string,
    avatar: string,
  ): Promise<CreateUserResponseDto> {
    const foundUser = await this.findOne({ username });
    if (foundUser) {
      throw new BadRequestException('User already exists');
    }
    const uuid = uuidv4();
    const createdUser = new this.usersRepository({
      avatar,
      hash: sha256.x2(hash),
      username,
      uuid,
    });
    await createdUser.save();

    return { uuid };
  }
}
