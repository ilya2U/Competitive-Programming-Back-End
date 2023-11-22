import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { AuthGuard } from '@/auth';
import { Task } from './schemas/task.schema';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @UseGuards(AuthGuard)
  @Get()
  async getTasks(): Promise<Task[]> {
    return this.taskService.find();
  }

  @UseGuards(AuthGuard)
  @Get('/:id')
  async getTask(@Param('id') uuid: string): Promise<Task> {
    return this.taskService.findOne({ uuid });
  }

  @UseGuards(AuthGuard)
  @Post()
  async createTask(@Body() payload: Task): Promise<Task> {
    return this.taskService.createTask(payload);
  }
}
