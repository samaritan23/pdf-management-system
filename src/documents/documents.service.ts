import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { validate } from 'class-validator';
import { Model } from 'mongoose';
import {
  CreateDocumentDto,
  DeleteDocumentResponseDto,
  GetDocumentsResponseDto,
  DocumentAllResponseDto,
  DocumentDataResponseDto,
} from 'src/dto/document.dto';
import * as multer from 'multer';
import { NewDocuments } from 'src/schemas/documents.schema';
import uploadToS3 from 'src/utils/s3';
import { v4 as uuidv4 } from 'uuid';
// import { SharedAccess } from 'aws-sdk/clients/macie2';
import { SharedAccess } from 'src/schemas/sharedAccess.schema';
import { User } from 'src/schemas/user.schema';
import { Comment } from 'src/schemas/comment.schema';
import { RevokedAccess } from 'src/schemas/revokeAccess.schema';
import { createTransporter } from 'src/utils/transporter';
// import config from 'src/config';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(NewDocuments.name)
    private readonly documentModel: Model<NewDocuments>,
    @InjectModel(SharedAccess.name)
    private readonly sharedAccessModel: Model<SharedAccess>,
    @InjectModel(RevokedAccess.name)
    private readonly revokedAccessModel: Model<RevokedAccess>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Comment.name)
    private readonly commentModel: Model<Comment>,
    // @InjectModel(SubComment.name)
    // private readonly subCommentModel: Model<SubComment>,
  ) {}
  private generateUniqueLink(): string {
    // Generate a UUID (Universally Unique Identifier)
    return uuidv4();
  }
  async createDocument(
    createDocumentDto: CreateDocumentDto,
    userId: string,
    featuredImgFile: multer.File,
  ): Promise<DocumentDataResponseDto> {
    try {
      const validationErrors = await validate(createDocumentDto);

      if (validationErrors.length > 0) {
        const errorMessages = validationErrors
          .map((error) => Object.values(error.constraints))
          .flat()
          .join(', ');
        throw new BadRequestException(errorMessages);
      }

      let file = '';
      if (featuredImgFile) {
        const imageUrl = await uploadToS3(featuredImgFile);
        const imagePath = imageUrl.Location;
        file = imagePath.substring(imagePath.lastIndexOf('/') + 1);
      }

      const createdDocument = await this.documentModel.create({
        ...createDocumentDto,
        userId,
        file, // Assign the URL directly
      });

      return new DocumentDataResponseDto(
        true,
        'Document created successfully',
        200,
        createdDocument,
      );
    } catch (error) {
      console.error('Error in createDocument:', error);
      throw error;
    }
  }

  async getUserDocuments(userId: string): Promise<DocumentAllResponseDto> {
    try {
      // Fetch documents owned by the user
      const ownedDocuments = await this.documentModel.find({ userId }).exec();

      const sharedAccesses = await this.sharedAccessModel
        .find({ userId })
        .populate<{ documentId: NewDocuments }>('documentId')
        .exec();
      const sharedDocuments = sharedAccesses.map((access) => {
        const document = access.documentId as NewDocuments;
        return {
          ...document.toObject(),
          isOwner: false,
        };
      });

      // Combine owned and shared documents
      const documents = ownedDocuments
        .map((doc) => ({
          ...doc.toObject(), // Convert Mongoose document to plain JavaScript object
          isOwner: true,
        }))
        .concat(sharedDocuments);
      const filteredDocuments = documents.filter((doc) => !doc.isArchived);

      return new DocumentAllResponseDto(
        true,
        'User documents retrieved successfully',
        200,
        filteredDocuments,
      );
    } catch (error) {
      console.error('Error retrieving user documents:', error);
      throw error;
    }
  }

  async findOne(id: string, userId: string): Promise<GetDocumentsResponseDto> {
    try {
      const document = await this.documentModel.findById(id).exec();
      if (!document) {
        throw new NotFoundException('Document not found');
      }
      const isOwner = document.userId.toString() === userId;
      if (!isOwner) {
        const sharedAccess = await this.sharedAccessModel
          .findOne({ documentId: id, userId })
          .exec();
        if (!sharedAccess) {
          throw new ForbiddenException(
            'You do not have access to this document',
          );
        }
      }
      return new GetDocumentsResponseDto(
        true,
        'Fetched document successfully',
        {
          ...document.toObject(),
          isOwner,
        },
      );
    } catch (error) {
      console.error('Error in findOne:', error);
      throw error;
    }
  }

  async deleteDocument(
    id: string,
    userId: string,
  ): Promise<DeleteDocumentResponseDto> {
    const document = await this.documentModel.findById(id).exec();

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.userId.toString() !== userId) {
      throw new ForbiddenException('You are not allowed to delete this file');
    }
    await this.documentModel.findByIdAndDelete(id).exec();

    return new DeleteDocumentResponseDto(
      true,
      'Document deleted successfully',
      document,
    );
  }

  async archiveDocument(
    id: string,
    userId: string,
  ): Promise<DeleteDocumentResponseDto> {
    const document = await this.documentModel.findById(id).exec();

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.userId.toString() !== userId) {
      throw new ForbiddenException('You are not allowed to Delete this file');
    }

    document.isArchived = true;
    await document.save();

    return new DeleteDocumentResponseDto(
      true,
      'Document archived successfully',
      document,
    );
  }

  async generateShareableLink(
    documentId: string,
  ): Promise<GetDocumentsResponseDto> {
    try {
      const document = await this.documentModel.findById(documentId).exec();
      if (!document) {
        throw new NotFoundException('Document not found');
      }

      if (document.shareLink) {
        return new GetDocumentsResponseDto(
          true,
          'Shareable link already exists',
          { shareLink: document.shareLink },
        );
      }

      const uniqueLink = this.generateUniqueLink();

      const updatedDocument = await this.documentModel
        .findByIdAndUpdate(documentId, { shareLink: uniqueLink }, { new: true })
        .exec();

      return new GetDocumentsResponseDto(
        true,
        'Shareable link generated successfully',
        { shareLink: updatedDocument.shareLink },
      );
    } catch (error) {
      console.error('Error in generateShareableLink:', error);
      throw error;
    }
  }

  // async getDocumentByShareableLink(
  //   shareableLink: string,
  // ): Promise<NewDocuments | null> {
  //   return this.documentModel.findOne({ shareLink: shareableLink }).exec();
  // }

  async createSharedAccess(
    userId: string,
    documentId: string,
    verificationToken?: string,
    tokenExpires?: number,
  ): Promise<SharedAccess> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const sharedAccess = new this.sharedAccessModel({
        documentId,
        userId: user._id,
        verificationToken,
        tokenExpires,
      });

      return await sharedAccess.save();
    } catch (error) {
      console.error('Error in createSharedAccess:', error);
      throw error;
    }
  }

  async handleOpenSharedLink(
    userId: string,
    shareableLinkOrToken: string,
  ): Promise<GetDocumentsResponseDto> {
    let document = await this.documentModel
      .findOne({ shareLink: shareableLinkOrToken })
      .exec();

    if (!document) {
      const sharedAccess = await this.sharedAccessModel
        .findOne({ verificationToken: shareableLinkOrToken })
        .exec();

      // If a shared access is found, retrieve the associated document
      if (sharedAccess) {
        document = await this.documentModel
          .findById(sharedAccess.documentId)
          .exec();
      }
      if (sharedAccess.userId.toString() !== userId) {
        throw new ForbiddenException('You do not have access to this document');
      }
    }

    // If the document is still not found, throw an exception
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check if access to the document has been revoked for the user
    const revokedAccess = await this.revokedAccessModel
      .findOne({
        documentId: document._id,
        userId,
      })
      .exec();

    if (revokedAccess) {
      throw new ForbiddenException('Access to this document has been revoked');
    }

    // Check if the user already has shared access to the document
    const sharedAccess = await this.sharedAccessModel
      .findOne({
        documentId: document._id,
        userId,
      })
      .exec();

    // If the user doesn't have access and is not the owner, create shared access
    if (!sharedAccess && document.userId.toString() !== userId) {
      await this.createSharedAccess(
        userId,
        document._id.toString(),
        shareableLinkOrToken,
      );
    }

    // Populate comments and their respective user information
    const docs = await this.documentModel
      .findById(document._id)
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'username' },
      })
      .exec();

    return new GetDocumentsResponseDto(true, 'File Opened successfully', docs);
  }

  async revokeAccess(
    documentId: string,
    userId: string,
  ): Promise<GetDocumentsResponseDto> {
    await this.sharedAccessModel.deleteOne({ documentId, userId });
    await this.revokedAccessModel.create({ documentId, userId });

    return new GetDocumentsResponseDto(true, 'Access revoked successfully');
  }

  // async grantAccess(
  //   documentId: string,
  //   userId: string,
  // ): Promise<GetDocumentsResponseDto> {
  //   await this.revokedAccessModel.deleteOne({ documentId, userId });
  //   await this.createSharedAccess(userId, documentId);

  //   return new GetDocumentsResponseDto(true, 'Access granted successfully');
  // }
  private async sendVerificationEmail(
    email: string,
    verificationUrl: string,
    sharedByUsername: string,
    documentTitle: string,
  ): Promise<void> {
    try {
      const transporter = await createTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: 'Access Verification',
        html: `
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 10px;">
        <h2 style="color: #333;">Hello,</h2>
        <p style="color: #555;">${sharedByUsername} Wants to share a document with you .</p>
        <p style="color: #555;">The document's title is: <strong>${documentTitle}</strong>.</p>
        <p style="color: #555;">You can view the document by clicking the link below:</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${verificationUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
        </div>
      </div>

      `,
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }
  async grantAccess(
    documentId: string,
    userId: string,
    LoggeduserId: string,
  ): Promise<GetDocumentsResponseDto> {
    const existingSharedAccess = await this.sharedAccessModel
      .findOne({
        documentId,
        userId,
      })
      .exec();
    const Loggeduser = await this.userModel.findById(LoggeduserId).exec();
    if (existingSharedAccess) {
      return new GetDocumentsResponseDto(
        true,
        'User already has permission to view this file',
      );
    }
    await this.revokedAccessModel.deleteOne({ documentId, userId });

    const verificationToken = this.generateUniqueLink();
    const tokenExpires = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

    await this.createSharedAccess(
      userId,
      documentId,
      verificationToken,
      tokenExpires,
    );

    const document = await this.documentModel.findById(documentId).exec();

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const verificationUrl = `${process.env.DOMAIN}/pdf?token=${verificationToken}`;

    await this.sendVerificationEmail(
      user.email,
      verificationUrl,
      Loggeduser.username,
      document.title,
    );

    return new GetDocumentsResponseDto(
      true,
      'Invitation link sent successfully in mail',
    );
  }

  async addComment(
    documentId: string,
    userId: string,
    comment: string,
    textRange?: { start: number; end: number },
    parentCommentId?: string,
  ): Promise<any> {
    try {
      // Create a new comment object
      const newCommentData: any = {
        user: userId,
        comment: comment,
        replies: [],
      };

      // Add textRange if provided
      if (textRange) {
        newCommentData.textRange = textRange;
      }

      const newComment = new this.commentModel(newCommentData);

      const savedComment = await newComment.save();

      let updatedDocument;

      if (parentCommentId) {
        // Check if the document and the parent comment exist
        const document = await this.documentModel.findOne({
          _id: documentId,
          comments: parentCommentId,
        });

        if (!document) {
          console.error(
            `Document with ID ${documentId} and parent comment ID ${parentCommentId} not found.`,
          );
          throw new NotFoundException('Document or parent comment not found');
        }

        // Update the parent comment's replies
        updatedDocument = await this.commentModel
          .findByIdAndUpdate(
            parentCommentId,
            {
              $push: {
                replies: {
                  user: savedComment.user,
                  comment: savedComment.comment,
                },
              },
            },
            { new: true },
          )
          .populate({
            path: 'replies.user',
            model: User.name,
          });
      } else {
        updatedDocument = await this.documentModel
          .findByIdAndUpdate(
            documentId,
            {
              $push: { comments: savedComment._id },
            },
            { new: true },
          )
          .populate({
            path: 'comments.replies',
            populate: {
              path: 'replies',
              model: 'SubComment',
            },
          })
          .exec();
      }

      if (!updatedDocument) {
        console.error(`Document with ID ${documentId} not found.`);
        throw new NotFoundException('Document not found');
      }

      return {
        success: true,
        message: 'Comment added successfully',
        comments: updatedDocument.comments,
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new InternalServerErrorException(
        'An error occurred while adding the comment',
      );
    }
  }

  async getComments(documentId: string): Promise<GetDocumentsResponseDto> {
    try {
      const document = await this.documentModel
        .findById(documentId)
        .populate({
          path: 'comments',
          populate: [
            { path: 'user', select: 'username' },
            { path: 'replies.user', select: 'username' },
          ],
        })
        .exec();

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      return new GetDocumentsResponseDto(
        true,
        'Comments retrieved successfully',
        { comments: document.comments },
      );
    } catch (error) {
      console.error('Error in getComments:', error);
      throw error;
    }
  }
}
