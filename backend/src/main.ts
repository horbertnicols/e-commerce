import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  // 全局前缀
  app.setGlobalPrefix('api');

  // 静态资源：上传的图片
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // 启用 CORS
  app.enableCors({
    origin: ['http://localhost:3000'], // 前端地址
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动过滤非 DTO 定义的属性
      forbidNonWhitelisted: true, // 存在非白名单属性时抛出错误
      transform: true, // 自动类型转换
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
}

bootstrap();
