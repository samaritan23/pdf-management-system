import mongoose, { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';

@Schema()
export class Comment extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user: string;

  @Prop({ type: String, required: true })
  comment: string;

  @Prop({ type: { start: Number, end: Number }, required: false })
  textRange?: { start: number; end: number };

  @Prop({
    type: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: User.name },
        comment: String,
      },
    ],
    default: [],
  })
  replies: { user: string; comment: string }[];
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
