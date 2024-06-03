import { IsString, IsOptional } from 'class-validator';
import { NewDocuments } from 'src/schemas/documents.schema';

export class CreateDocumentDto {
  @IsString({ message: 'User ID must be a string' })
  @IsOptional()
  userId: string;

  @IsOptional()
  file: any;
  @IsOptional()
  title: any;
  @IsOptional()
  category: any;
}
export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  file?: string;
}
export class DocumentResponseDto {
  success: boolean;
  message: string;
  data?: any;

  constructor(success: boolean, message: string, data?: any) {
    this.success = success;
    this.message = message;
    this.data = data;
  }
}

export class DocumentDataResponseDto {
  constructor(
    public success: boolean,
    public message: string,
    public statusCode: number,
    public data?: Partial<NewDocuments>,
  ) {}
}
export class DocumentAllResponseDto {
  constructor(
    public success: boolean,
    public message: string,
    public statusCode: number,
    public data?: any[],
  ) {}
}
export class GetDocumentsResponseDto extends DocumentResponseDto {
  constructor(success: boolean, message: string, data?: any) {
    super(success, message, data);
  }
}

export class UpdateDocumentResponseDto extends DocumentResponseDto {
  constructor(success: boolean, message: string, data?: any) {
    super(success, message, data);
  }
}

export class DeleteDocumentResponseDto extends DocumentResponseDto {
  constructor(success: boolean, message: string, data?: any) {
    super(success, message, data);
  }
}
