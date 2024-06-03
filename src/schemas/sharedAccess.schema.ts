import mongoose, { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';
import { NewDocuments } from './documents.schema';

@Schema()
export class SharedAccess extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: NewDocuments.name,
    required: true,
  })
  documentId: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId: string;

  @Prop({ type: String, required: true })
  verificationToken: string;

  @Prop({ type: Number })
  tokenExpires: number;
  @Prop({ type: Number, default: () => Math.floor(Date.now() / 1000) })
  sharedAt: number;
}

export const SharedAccessSchema = SchemaFactory.createForClass(SharedAccess);
