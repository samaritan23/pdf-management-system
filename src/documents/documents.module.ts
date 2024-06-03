import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { NewDocuments, NewDocumentsSchema } from '../schemas/documents.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from 'src/auth/auth.service';
import { AuthorizationMiddleware } from 'src/auth/authorization.middleware';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  SharedAccess,
  SharedAccessSchema,
} from 'src/schemas/sharedAccess.schema';
import { Comment, CommentSchema } from 'src/schemas/comment.schema';
import {
  RevokedAccess,
  RevokedAccessSchema,
} from 'src/schemas/revokeAccess.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NewDocuments.name, schema: NewDocumentsSchema },
      { name: SharedAccess.name, schema: SharedAccessSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: RevokedAccess.name, schema: RevokedAccessSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [
    DocumentsService,
    AuthorizationMiddleware,
    JwtAuthGuard,
    AuthService,
  ],
  controllers: [DocumentsController],
})
export class DocumentsModule {}
