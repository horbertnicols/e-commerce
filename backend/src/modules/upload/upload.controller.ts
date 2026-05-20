import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MERCHANT)
export class UploadController {
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'products'),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
          return cb(new BadRequestException('仅支持 jpg/png/webp 格式'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('未收到文件');
    }
    return { url: `/uploads/products/${file.filename}` };
  }

  @Post('site')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'site'),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
          return cb(new BadRequestException('仅支持 jpg/png/webp 格式'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadSiteImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('未收到文件');
    }
    return { url: `/uploads/site/${file.filename}` };
  }
}
