import mongoose, { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';
import { NewDocuments } from './documents.schema';

@Schema()
export class RevokedAccess extends Document {
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

  @Prop({ type: Date, default: Date.now })
  revokedAt: Date;
}

export const RevokedAccessSchema = SchemaFactory.createForClass(RevokedAccess);
