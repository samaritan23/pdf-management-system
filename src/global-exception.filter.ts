import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { MongoError } from 'mongodb';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status: number;
    let message: string;

    if (exception instanceof BadRequestException) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message || 'Bad request';
      const errorResponse = exception.getResponse() as
        | { message: string }
        | string;
      message =
        typeof errorResponse === 'string'
          ? errorResponse
          : errorResponse.message || 'Bad request';
    } else if (exception instanceof UnauthorizedException) {
      status = HttpStatus.UNAUTHORIZED;
      message = 'Unauthorized';
    } else if (exception instanceof NotFoundException) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message || 'Resource not found';
    } else if (exception instanceof ForbiddenException) {
      status = HttpStatus.FORBIDDEN;
      message = exception.message || 'Forbidden';
    } else if (exception instanceof InternalServerErrorException) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse() as
        | { message: string }
        | string;
      message =
        typeof errorResponse === 'string'
          ? errorResponse
          : errorResponse.message || 'Bad request';
    } else if (exception instanceof MongoError && exception.code === 11000) {
      // MongoDB duplicate key error (E11000)
      status = HttpStatus.BAD_REQUEST;
      message = exception.message || 'Duplicate key';
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || 'Internal server error';
    }

    this.logger.error(`${request.method} ${request.url}`, exception.stack);

    response.status(status).json({
      success: false,
      message,
    });
  }
}
