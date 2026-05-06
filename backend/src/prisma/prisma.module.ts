import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 标记为全局模块，其他模块无需 import 即可使用 PrismaService
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
