import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TTaskDocument = HydratedDocument<Task>;

@Schema()
export class Task {
  @Prop()
  uuid: string;

  @Prop()
  description: string;

  @Prop()
  title: string;

  @Prop()
  results: [string, string][];
}

export const TaskSchema = SchemaFactory.createForClass(Task);
