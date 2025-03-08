import { 
  Controller, 
  Get, 
  Param, 
  Patch, 
  Body, 
  UseGuards,
  Query,
  Post
} from '@nestjs/common';
import { DeliveryRoutesService } from './delivery-routes.service';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UpdateRouteStopDto } from './dto/update-route-stop.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Role } from '@/common/enums/role.enum';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { PrismaService } from 'prisma/prisma.service';

@Controller('delivery-routes')
export class DeliveryRoutesController {
  constructor(
    private readonly deliveryRoutesService: DeliveryRoutesService,
    private readonly prisma: PrismaService
  ) {}

  @Get('available')
  async getAvailableRoutes() {
    return this.deliveryRoutesService.getAvailableRoutes();
  }

  @Get()
  async getRoutes(
    @Query('driverId') driverId?: string,
    @Query('warehouseId') warehouseId?: string
  ) {
    if (driverId) {
      return this.deliveryRoutesService.getRoutesByDriver(driverId);
    }
    
    if (warehouseId) {
      return this.deliveryRoutesService.getRoutesByWarehouse(warehouseId);
    }
    
    // If no query params, return an empty array or implement pagination later
    return [];
  }
  

  @Get('warehouse/:warehouseId')
  async getWarehouseRoutes(@Param('warehouseId') warehouseId: string) {
    return this.deliveryRoutesService.getRoutesByWarehouse(warehouseId);
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('driver')
  async getDriverRoutes(@GetUser('id') userId: string) {
    // Get driver ID from user ID
    const driver = await this.prisma.driver.findFirst({
      where: { userId }
    });
    
    if (!driver) {
      return [];
    }
    
    return this.deliveryRoutesService.getRoutesByDriver(driver.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getRouteById(@Param('id') id: string) {
    return this.deliveryRoutesService.getRouteById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER)
  @Post(':id/assign')
  async assignDriverToRoute(
    @Param('id') id: string,
    @Body() dto: AssignDriverDto
  ) {
    return this.deliveryRoutesService.assignDriverToRoute(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('stops/:id')
  async updateRouteStop(
    @Param('id') id: string,
    @Body() dto: UpdateRouteStopDto
  ) {
    return this.deliveryRoutesService.updateRouteStop(id, dto);
  }
} 