import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  UseGuards,
  Request,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/role.enum';
import { ReportVehicleIssueDto } from './dto/report-vehicle-issue.dto';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER)
  @Get('driver')
  async getDriverVehicle(@Request() req) {
    const userId = req.user.id;
    const vehicle = await this.vehiclesService.getDriverVehicle(userId);
    
    if (!vehicle) {
      throw new NotFoundException('No vehicle assigned to this driver');
    }
    
    return vehicle;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER)
  @Post('issues')
  async reportVehicleIssue(@Request() req, @Body() issueData: ReportVehicleIssueDto) {
    const userId = req.user.id;
    const driver = await this.vehiclesService.getDriverByUserId(userId);
    
    if (!driver || !driver.vehicleId) {
      throw new UnauthorizedException('You do not have a vehicle assigned');
    }
    
    return this.vehiclesService.reportVehicleIssue(driver.vehicleId, issueData);
  }
} 