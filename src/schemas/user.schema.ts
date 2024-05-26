import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserType = 'admin' | 'author';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  username: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: false })
  lastName: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  profilePic: string;

  @Prop({ type: Number, default: () => Math.floor(Date.now() / 1000) })
  createdAt: number;

  @Prop({ type: Number, default: () => Math.floor(Date.now() / 1000) })
  updatedAt: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
