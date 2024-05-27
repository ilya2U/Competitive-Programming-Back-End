import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TUserDocument = HydratedDocument<User>;

@Schema()
export class User {

  @Prop()
  uuid: string;

  @Prop()
  connId: string;

  @Prop()
  username: string;

  @Prop()
  avatar: string;

  @Prop()
  hash: string;
  
  @Prop({ default: 0 })
  points: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
