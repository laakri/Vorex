import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto, PaginatedResponse } from './dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(sellerId: string, { page = 1, limit = 10 }: PaginationDto): Promise<PaginatedResponse<any>> {
    const seller = await this.prisma.seller.findUnique({
      where: { userId: sellerId },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const skip = (page - 1) * limit;

    const [total, products] = await Promise.all([
      this.prisma.product.count({
        where: { sellerId: seller.id },
      }),
      this.prisma.product.findMany({
        where: { sellerId: seller.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return {
      data: products,
      meta: {
        total,
        page,
        lastPage,
      },
    };
  }

  async create(userId: string, dto: CreateProductDto) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    return this.prisma.product.create({
      data: {
        ...dto,
        sellerId: seller.id,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateProductDto) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const product = await this.prisma.product.findFirst({
      where: { id, sellerId: seller.id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const product = await this.prisma.product.findFirst({
      where: { id, sellerId: seller.id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
