import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggerService } from './core/logger/logger.service';

async function bootstrap() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(LoggerService));
  app.enableCors({
    origin: [
      'https://danielnoworyta.com',
      /\.danielnoworyta\.com$/,
      'https://danielnoworyta.pl',
      /\.danielnoworyta\.pl$/,
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const host = `0.0.0.0`;
  await app.listen(port, host);
}
bootstrap();
