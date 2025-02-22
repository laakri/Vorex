import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'debug', 'log', 'verbose'],
    });
    const configService = app.get(ConfigService);

    // Add global prefix
    app.setGlobalPrefix('api');

    // Get CORS configuration
    const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS')?.split(',') || [];
    const corsEnabled = configService.get<boolean>('CORS_ENABLED', true);
    
    if (corsEnabled) {
      app.enableCors({
        origin: allowedOrigins.length ? allowedOrigins : true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
      });
    }

    // Global Exception Filter
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        enableDebugMessages: process.env.NODE_ENV !== 'production',
      }),
    );

    const port = configService.get<number>('PORT', 3000);
    await app.listen(port);
    logger.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    logger.error('Failed to start application:', error);
    throw error;
  }
}

bootstrap();
