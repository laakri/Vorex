import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '../auth/guards/roles.guard';

@Controller('sellers')
@UseGuards(JwtAuthGuard, RolesGuard)
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
}
