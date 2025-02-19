import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  BadRequestException,
  Patch,
  Param,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/role.enum';
import { GetUser } from '@/common/decorators/get-user.decorator';

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post('register')
  @HttpCode(201)
  async registerDriver(
    @GetUser('id') userId: string,
    @Body('driver') createDriverDto: CreateDriverDto,
    @Body('vehicle') createVehicleDto: CreateVehicleDto
  ) {
    try {
      return await this.driversService.register(userId, createDriverDto, createVehicleDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  async approveDriver(@Param('id') driverId: string) {
    try {
      return await this.driversService.approveDriver(driverId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  async rejectDriver(
    @Param('id') driverId: string,
    @Body('reason') reason: string
  ) {
    try {
      return await this.driversService.rejectDriver(driverId, reason);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
} 