import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Request,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import {
  CreateDocumentDto,
  DeleteDocumentResponseDto,
  DocumentAllResponseDto,
  GetDocumentsResponseDto,
} from 'src/dto/document.dto';
import * as multer from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { SubComment } from 'src/schemas/comment.schema';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentService: DocumentsService) {}
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async createDocument(
    @Request() req,
    @Res() res,
    @UploadedFiles() files: multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
  ) {
    const userId = req.user.userId;
    const featuredImgFile =
      files.find((file) => file.fieldname === 'file') || null;
    createDocumentDto.userId = userId;
    const response = await this.documentService.createDocument(
      createDocumentDto,
      createDocumentDto.userId,
      featuredImgFile,
    );
    res.status(response.statusCode).json(response);
  }
  @Get('user-documents')
  @UseGuards(JwtAuthGuard)
  async getUserDocuments(@Request() req): Promise<DocumentAllResponseDto> {
    try {
      const userId = req.user.userId;
      const documents = await this.documentService.getUserDocuments(userId);

      return documents;
    } catch (error) {
      console.error('Error retrieving user documents:', error);
      throw error;
    }
  }
  @Get('singleDoc/:id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @Req() req,
  ): Promise<GetDocumentsResponseDto> {
    try {
      const userId = req.user.userId;
      const document = await this.documentService.findOne(id, userId);

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      return document;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  }

  @Delete('delete/:documentId')
  async deleteDocument(
    @Param('documentId') documentId: string,
    @Req() req,
  ): Promise<DeleteDocumentResponseDto> {
    const userId = req.user.userId;
    return this.documentService.deleteDocument(documentId, userId);
  }

  @Patch('archive/:documentId')
  async archiveDocument(
    @Param('documentId') documentId: string,
    @Req() req,
  ): Promise<DeleteDocumentResponseDto> {
    const userId = req.user.userId;
    return this.documentService.archiveDocument(documentId, userId);
  }
  @Post('shareable-link/:documentId')
  @UseGuards(JwtAuthGuard)
  async generateShareableLink(
    @Param('documentId') documentId: string,
  ): Promise<GetDocumentsResponseDto> {
    const shareableLink =
      await this.documentService.generateShareableLink(documentId);
    return shareableLink;
  }
  @Get('open-link')
  @UseGuards(JwtAuthGuard)
  async openSharedLink(@Query('token') token: string, @Request() req) {
    const userId = req.user.userId; // Assumes user ID is stored in the request user object

    const document = await this.documentService.handleOpenSharedLink(
      userId,
      token,
    );
    if (!document) {
      throw new NotFoundException('Document not found or access denied');
    }

    return document;
  }
  @Post('revoke-access/:documentId')
  @UseGuards(JwtAuthGuard)
  async revokeAccess(
    @Param('documentId') documentId: string,
    @Body('userId') userId: string,
  ): Promise<GetDocumentsResponseDto> {
    return this.documentService.revokeAccess(documentId, userId);
  }
  @Post('grant-access/:documentId')
  @UseGuards(JwtAuthGuard)
  async grantAccess(
    @Param('documentId') documentId: string,
    @Body('userId') userId: string,
    @Req() req,
  ): Promise<GetDocumentsResponseDto> {
    const LoggeduserId = req.user.userId;
    return this.documentService.grantAccess(documentId, userId, LoggeduserId);
  }

  @Post('add-comment/:documentId')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('documentId') documentId: string,
    @Request() req,
    @Body() body: any,
  ): Promise<any> {
    const userId = req.user.userId;
    const { comment, textRange, parentCommentId } = body;

    try {
      await this.documentService.addComment(
        documentId,
        userId,
        comment,
        textRange,
        parentCommentId,
      );
      return {
        success: true,
        message: 'Comment added successfully',
      };
    } catch (error) {
      throw new NotFoundException('Document not found');
    }
  }

  @Get('get-comments/:documentId')
  @UseGuards(JwtAuthGuard)
  async getComments(
    @Param('documentId') documentId: string,
  ): Promise<GetDocumentsResponseDto> {
    return this.documentService.getComments(documentId);
  }
}
