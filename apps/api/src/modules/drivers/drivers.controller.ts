import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  BadRequestException,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { DriverEarningsService } from './driver-earnings.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { UpdateDriverVehicleDto } from './dto/update-driver-vehicle.dto';
import { UpdateDriverAvailabilityDto } from './dto/update-driver-availability.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/role.enum';
import { GetUser } from '@/common/decorators/get-user.decorator';

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(
    private readonly driversService: DriversService,
    private readonly driverEarningsService: DriverEarningsService,
  ) {}

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
  @Roles(Role.ADMIN , Role.SELLER)
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

  @Get('profile')
  @Roles(Role.DRIVER)
  async getDriverProfile(@GetUser('id') userId: string) {
    try {
      return await this.driversService.getDriverProfile(userId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('profile')
  @Roles(Role.DRIVER)
  async updateDriverProfile(
    @GetUser('id') userId: string,
    @Body() updateDriverDto: UpdateDriverProfileDto
  ) {
    try {
      return await this.driversService.updateDriverProfile(userId, updateDriverDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('vehicle')
  @Roles(Role.DRIVER)
  async updateDriverVehicle(
    @GetUser('id') userId: string,
    @Body() updateVehicleDto: UpdateDriverVehicleDto
  ) {
    try {
      return await this.driversService.updateDriverVehicle(userId, updateVehicleDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('availability')
  @Roles(Role.DRIVER)
  async updateDriverAvailability(
    @GetUser('id') userId: string,
    @Body() updateAvailabilityDto: UpdateDriverAvailabilityDto
  ) {
    try {
      return await this.driversService.updateDriverAvailability(
        userId, 
        updateAvailabilityDto.status
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('dashboard')
  @Roles(Role.DRIVER)
  async getDriverDashboard(
    @Request() req,
    @Query('timeRange') timeRange: string = '7d'
  ) {
    return this.driversService.getDriverDashboard(req.user.id, timeRange);
  }

  @Get('earnings')
  @Roles(Role.DRIVER)
  async getDriverEarnings(
    @GetUser('id') userId: string,
    @Query('timeRange') timeRange: string = '30d',
    @Query('status') status: string = 'all'
  ) {
    try {
      return await this.driverEarningsService.getDriverEarnings(userId, timeRange);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
} 