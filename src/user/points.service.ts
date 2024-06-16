import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TUserDocument, User } from './schemas/user.schema';

@Injectable()
export class PointsService {
  constructor(@InjectModel(User.name) private userModel: Model<TUserDocument>) {}

  async getAllUsersSortedByPoints(): Promise<TUserDocument[]> {
    return this.userModel.find().sort({ points: -1 }).exec();
  }

  async addPointsByUuid(uuid: string): Promise<TUserDocument | null> {
    const user = await this.userModel.findOneAndUpdate({ uuid }, { $inc: { points: 10 } }, { new: true }).exec();
    return user;
  }
  
}