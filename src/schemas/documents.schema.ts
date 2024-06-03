import mongoose, { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Comment } from './comment.schema';

@Schema()
export class NewDocuments extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId: string;

  @Prop({ type: String, required: false, default: '' })
  file: string;

  @Prop({ type: String, required: false, default: '' })
  title: string;

  @Prop({ type: String, required: false, default: '' })
  category: string;

  @Prop({ type: Boolean, required: true, default: false })
  isArchived: boolean;

  @Prop({ type: Number, default: () => Math.floor(Date.now() / 1000) })
  createdAt: number;

  @Prop({ type: Number, default: () => Math.floor(Date.now() / 1000) })
  updatedAt: number;

  @Prop({ type: String })
  shareLink: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: Comment.name }],
    default: [],
  })
  comments: string[];
}

export const NewDocumentsSchema = SchemaFactory.createForClass(NewDocuments);
