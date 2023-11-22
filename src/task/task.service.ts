import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Task, TTaskDocument } from './schemas/task.schema';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name)
    private tasksRepository: Model<TTaskDocument>,
  ) {}

  /* Database methods */

  async findOne(knownData: Partial<Task>): Promise<TTaskDocument> {
    return await this.tasksRepository.findOne(knownData).exec();
  }

  async findById(id: string): Promise<TTaskDocument> {
    return await this.tasksRepository.findById(id).exec();
  }

  async find(): Promise<TTaskDocument[]> {
    return await this.tasksRepository.find().exec();
  }

  async updateOne(id: string, $set: Partial<Task>): Promise<TTaskDocument> {
    return await this.tasksRepository.findByIdAndUpdate(id, { $set }).exec();
  }

  /* API methods */

  async createTask(payload: Task): Promise<Task> {
    const foundTask = await this.findOne({ title: payload.title });
    if (foundTask) {
      throw new BadRequestException('Task with such title already exists');
    }
    const uuid = uuidv4();
    payload.uuid = uuid;

    const createdTask = new this.tasksRepository(payload);
    await createdTask.save();

    return createdTask;
  }
}
