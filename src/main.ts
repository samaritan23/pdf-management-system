import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';
import { HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { AuthorizationMiddleware } from './auth/authorization.middleware';
import { GlobalExceptionFilter } from './global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    cors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204,
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      exceptionFactory: (errors) => {
        const validationErrors = errors
          .map((error) => {
            // Extract specific messages from each constraint
            return Object.values(error.constraints);
          })
          .flat();
        return new HttpException(
          { message: validationErrors, success: false },
          HttpStatus.BAD_REQUEST,
        );
      },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.use(new AuthorizationMiddleware().use);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
