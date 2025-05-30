import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  // this method is reccomended in the official documentation for working with the nestjs-form-data
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.use(cookieParser());

  console.log(
    `🚀 Server started at http://localhost:${process.env.PORT ?? 3000}. TimeStamp: ${new Date()}.`,
  );
}
bootstrap();
