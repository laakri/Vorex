import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ProductsService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('sellers/products')
@UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('SELLER')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@GetUser('id') sellerId: string) {
    return this.productsService.findAll(sellerId);
  }

  @Post()
  create(@GetUser('id') sellerId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(sellerId, dto);
  }

  @Put(':id')
  update(
    @GetUser('id') sellerId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(sellerId, id, dto);
  }

  @Delete(':id')
  remove(@GetUser('id') sellerId: string, @Param('id') id: string) {
    return this.productsService.remove(sellerId, id);
  }
}
