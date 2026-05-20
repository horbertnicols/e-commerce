import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ErrorCode } from '../../common/filters/http-exception.filter';

const DEFAULT_CONFIGS: Record<string, string> = {
  hero_image:
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=2000&q=80',
  hero_title: '发现优质好物',
  hero_description: '精选商品，品质保证，快速配送，购物无忧',
  hero_button_text: '立即选购',
};

@Injectable()
export class SiteConfigService {
  constructor(private readonly prisma: PrismaService) {}

  // 公开读取：返回 key-value 对象，缺值时用默认值填充
  async getPublic() {
    const rows = await this.prisma.siteConfig.findMany();
    const result: Record<string, string> = { ...DEFAULT_CONFIGS };
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  // 管理端读取全部配置
  async getAll() {
    const rows = await this.prisma.siteConfig.findMany({ orderBy: { key: 'asc' } });
    const result: Record<string, string> = { ...DEFAULT_CONFIGS };
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  // 管理端批量更新
  async updateBatch(data: Record<string, string>) {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined && v !== null);
    await Promise.all(
      entries.map(([key, value]) =>
        this.prisma.siteConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    );
    return this.getAll();
  }
}
