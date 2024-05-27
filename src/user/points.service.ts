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

  async getPointsById(id: string): Promise<number | null> {
    const user = await this.userModel.findById(id).exec();
    return user? user.points : null;
  }

  async addPointsById(id: string, pointsToAdd: number): Promise<TUserDocument | null> {
    const user = await this.userModel.findByIdAndUpdate(id, { $inc: { points: pointsToAdd } }, { new: true }).exec();
    return user;
  }
  
}