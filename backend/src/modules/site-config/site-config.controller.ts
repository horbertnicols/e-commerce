import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SiteConfigService } from './site-config.service';

@Controller()
export class SiteConfigController {
  constructor(private readonly siteConfigService: SiteConfigService) {}

  @Public()
  @Get('site-config')
  async getPublic() {
    return this.siteConfigService.getPublic();
  }

  @Get('admin/site-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAll() {
    return this.siteConfigService.getAll();
  }

  @Put('admin/site-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateBatch(@Body() data: Record<string, string>) {
    return this.siteConfigService.updateBatch(data);
  }
}
