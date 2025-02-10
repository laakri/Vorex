import { Controller, Post, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/role.enum';
import { GetUser } from '@/common/decorators/get-user.decorator';

@Controller('sellers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER)
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Post('complete-profile')
  @Roles(Role.SELLER)
  async completeProfile(
    @GetUser('id') userId: string,
    @Body() dto: CompleteProfileDto,
  ) {
    return this.sellersService.completeProfile(userId, dto);
  }

  @Get('store-settings')
  async getStoreSettings(@GetUser('id') userId: string) {
    return this.sellersService.getStoreSettings(userId);
  }

  @Patch('store-settings')
  async updateStoreSettings(
    @GetUser('id') userId: string,
    @Body() dto: UpdateStoreSettingsDto
  ) {
    return this.sellersService.updateStoreSettings(userId, dto);
  }
}
