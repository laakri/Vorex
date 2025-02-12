import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import { Role } from '@/common/enums/role.enum';
import { OrderStatus } from '@prisma/client';

interface DailyStats {
  date: Date;
  order_count: number;
  total_amount: number;
}

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService) {}

  async completeProfile(userId: string, dto: CompleteProfileDto) {
    // Check if seller profile already exists
    const existingSeller = await this.prisma.seller.findFirst({
      where: { userId },
    });

    if (existingSeller) {
      throw new BadRequestException('Seller profile already exists');
    }

    // Create seller profile
    const seller = await this.prisma.seller.create({
      data: {
        userId,
        businessName: dto.businessName,
        businessType: dto.businessType,
        description: dto.description,
        address: dto.address,
        city: dto.city,
        governorate: dto.governorate,
        postalCode: dto.postalCode,
        phone: dto.phone,
        registrationNo: dto.registrationNo,
        taxId: dto.taxId,
        isVerified: true,
      },
    });

    // Update user role to SELLER if not already
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: Role.SELLER },
    });

    return seller;
  }

  async getStoreSettings(userId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: {
        id: true,
        businessName: true,
        businessType: true,
        description: true,
        address: true,
        city: true,
        governorate: true,
        postalCode: true,
        phone: true,
        registrationNo: true,
        taxId: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true,
            fullName: true
          }
        }
      }
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    return seller;
  }

  async updateStoreSettings(userId: string, dto: UpdateStoreSettingsDto) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId }
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    return this.prisma.seller.update({
      where: { userId },
      data: {
        businessName: dto.businessName,
        businessType: dto.businessType,
        description: dto.description,
        address: dto.address,
        city: dto.city,
        governorate: dto.governorate,
        postalCode: dto.postalCode,
        phone: dto.phone,
        registrationNo: dto.registrationNo,
        taxId: dto.taxId,
      }
    });
  }

  async getDashboardData(userId: string, timeRange: string = '7d') {
    const seller = await this.prisma.seller.findUnique({
      where: { userId }
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const [orders, products, topProducts, ordersByStatus, revenueByGovernorate] = await Promise.all([
      // Get all orders with orderItems included
      this.prisma.order.findMany({
        where: {
          sellerId: seller.id,
          createdAt: { gte: startDate }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  category: true
                }
              }
            }
          }
        }
      }),

      // Get all products
      this.prisma.product.findMany({
        where: {
          sellerId: seller.id,
        },
        select: {
          id: true,
          name: true,
          stock: true,
          category: true,
          price: true
        }
      }),

      // Get top products by sales
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            sellerId: seller.id,
            createdAt: { gte: startDate }
          }
        },
        _sum: {
          quantity: true,
          price: true,
        },
        orderBy: {
          _sum: {
            price: 'desc'
          }
        },
        take: 5
      }),

      // Orders by status over time
      this.prisma.order.groupBy({
        by: ['status', 'createdAt'],
        where: {
          sellerId: seller.id,
          createdAt: { gte: startDate }
        },
        _count: true
      }),

      // Revenue by governorate
      this.prisma.order.groupBy({
        by: ['governorate'],
        where: {
          sellerId: seller.id,
          createdAt: { gte: startDate }
        },
        _sum: {
          totalAmount: true
        }
      })
    ]);

    // Calculate revenue by category using orderItems
    const revenueByCategory = orders.reduce((acc, order) => {
      order.items.forEach(item => {
        const category = item.product.category;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += item.price * item.quantity;
      });
      return acc;
    }, {} as Record<string, number>);

    // Calculate order metrics
    const orderMetrics = {
      total: orders.length,
      totalAmount: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
      processing: orders.filter(o => o.status === OrderStatus.PROCESSING).length,
      readyForPickup: orders.filter(o => o.status === OrderStatus.READY_FOR_PICKUP).length,
      inTransit: orders.filter(o => o.status === OrderStatus.IN_TRANSIT).length,
      delivered: orders.filter(o => o.status === OrderStatus.DELIVERED).length,
      cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED).length,
    };

    // Calculate product metrics
    const productMetrics = {
      totalProducts: products.length,
      lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
      outOfStock: products.filter(p => p.stock === 0).length,
      categoriesCount: new Set(products.map(p => p.category)).size,
      averagePrice: products.reduce((sum, p) => sum + p.price, 0) / products.length
    };

    // Calculate daily revenue data
    const dailyData = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { amount: 0, orders: 0 };
      }
      acc[date].amount += order.totalAmount;
      acc[date].orders += 1;
      return acc;
    }, {} as Record<string, { amount: number; orders: number }>);

    // Transform orders by status over time
    const orderStatusTimeline = ordersByStatus.reduce((acc, stat) => {
      const date = stat.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {};
      }
      acc[date][stat.status] = stat._count;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return {
      orderMetrics,
      productMetrics,
      revenueData: {
        daily: Object.entries(dailyData).map(([date, data]) => ({
          date,
          ...data
        })),
        byCategory: Object.entries(revenueByCategory).map(([category, amount]) => ({
          category,
          amount,
          percentage: (amount / orderMetrics.totalAmount) * 100
        })),
        byGovernorate: revenueByGovernorate.map(gov => ({
          governorate: gov.governorate,
          amount: gov._sum.totalAmount || 0
        }))
      },
      orderStatusTimeline: Object.entries(orderStatusTimeline).map(([date, statuses]) => ({
        date,
        ...statuses
      })),
      topProducts: await Promise.all(
        topProducts.map(async (product) => {
          const details = products.find(p => p.id === product.productId);
          return {
            id: product.productId,
            name: details?.name || 'Unknown Product',
            totalSold: product._sum.quantity || 0,
            revenue: product._sum.price || 0,
            currentStock: details?.stock || 0,
            category: details?.category || 'Unknown'
          };
        })
      )
    };
  }
}
