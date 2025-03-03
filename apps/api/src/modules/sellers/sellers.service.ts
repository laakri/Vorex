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

interface CategoryRevenue {
  category: string;
  revenue: number;
  percentage: number;
}

interface DailyRevenuePattern {
  time: string;
  revenue: number;
}

interface MonthlyPerformance {
  month: string;
  revenue: number;
  orders: number;
}

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService) {}

  async completeProfile(userId: string, dto: CompleteProfileDto) {
    const existingSeller = await this.prisma.seller.findFirst({
      where: { userId },
    });

    if (existingSeller) {
      throw new BadRequestException('Seller profile already exists');
    }

    // Create seller profile and update user in a transaction
    const [seller] = await this.prisma.$transaction([
      this.prisma.seller.create({
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
          latitude: dto.latitude,
          longitude: dto.longitude,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { 
          role: [Role.SELLER],
          isVerifiedSeller: true,
        },
      }),
    ]);

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
        latitude: dto.latitude,
        longitude: dto.longitude,
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
      // Get orders with items
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
                  name: true,
                  category: true,
                  stock: true
                }
              }
            }
          }
        }
      }),

      // Get products
      this.prisma.product.findMany({
        where: {
          sellerId: seller.id,
        }
      }),

      // Get top products
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

      // Orders by status
      this.prisma.order.groupBy({
        by: ['status'],
        where: {
          sellerId: seller.id,
          createdAt: { gte: startDate }
        },
        _count: true
      }),

      // Revenue by governorate
      this.prisma.order.groupBy({
        by: ['governorate'] as const,
        where: {
          sellerId: seller.id,
          createdAt: { gte: startDate }
        },
        _sum: {
          totalAmount: true
        },
        orderBy: {
          _sum: {
            totalAmount: 'desc'
          }
        }
      })
    ]);

    // Calculate metrics
    const orderMetrics = {
      total: orders.length,
      totalAmount: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
      processing: orders.filter(o => o.status === OrderStatus.ASSIGNED_TO_BATCH).length,
      readyForPickup: orders.filter(o => o.status === OrderStatus.PICKUP_COMPLETE).length,
      inTransit: orders.filter(o => o.status === OrderStatus.IN_TRANSIT).length,
      delivered: orders.filter(o => o.status === OrderStatus.DELIVERED).length,
      cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED).length,
    };

    const productMetrics = {
      totalProducts: products.length,
      lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
      outOfStock: products.filter(p => p.stock === 0).length,
      categoriesCount: new Set(products.map(p => p.category)).size,
    };

    // Process daily revenue data
    const dailyData = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { amount: 0, orders: 0 };
      }
      acc[date].amount += order.totalAmount;
      acc[date].orders += 1;
      return acc;
    }, {} as Record<string, { amount: number; orders: number }>);

    const [categoryRevenue, dailyPatterns, monthlyPerformance] = await Promise.all([
      // Revenue by category
      this.prisma.orderItem.findMany({
        where: {
          order: {
            sellerId: seller.id,
            createdAt: { gte: startDate }
          }
        },
        include: {
          product: {
            select: {
              category: true
            }
          }
        }
      }).then((items) => {
        // Group by category and calculate revenue
        const categoryMap = items.reduce((acc, item) => {
          const category = item.product?.category || 'Uncategorized';
          if (!acc[category]) {
            acc[category] = {
              revenue: 0,
              count: 0
            };
          }
          acc[category].revenue += item.price;
          acc[category].count += item.quantity;
          return acc;
        }, {} as Record<string, { revenue: number; count: number }>);

        // Calculate total revenue for percentages
        const totalRevenue = Object.values(categoryMap)
          .reduce((sum, { revenue }) => sum + revenue, 0);

        // Format the results
        return Object.entries(categoryMap).map(([category, data]) => ({
          category,
          revenue: data.revenue,
          percentage: totalRevenue > 0 
            ? Math.round((data.revenue / totalRevenue) * 100) 
            : 0
        }));
      }),

      // Daily patterns with error handling
      this.prisma.$queryRaw<DailyRevenuePattern[]>`
        SELECT 
          TO_CHAR("createdAt", 'HH24:00') as time,
          COALESCE(SUM("totalAmount"), 0) as revenue
        FROM "Order"
        WHERE 
          "sellerId" = ${seller.id}
          AND "createdAt" >= ${startDate}
        GROUP BY 
          TO_CHAR("createdAt", 'HH24:00')
        ORDER BY 
          time
      `.catch(() => []),

      // Monthly performance with error handling
      this.prisma.$queryRaw<MonthlyPerformance[]>`
        SELECT 
          TO_CHAR("createdAt", 'Mon') as month,
          COALESCE(SUM("totalAmount"), 0) as revenue,
          COUNT(*) as orders
        FROM "Order"
        WHERE 
          "sellerId" = ${seller.id}
          AND "createdAt" >= ${startDate}
        GROUP BY 
          TO_CHAR("createdAt", 'Mon')
        ORDER BY 
          MIN("createdAt")
      `.catch(() => [])
    ]);

    return {
      orderMetrics,
      productMetrics,
      revenueData: {
        daily: Object.entries(dailyData).map(([date, data]) => ({
          date,
          ...data
        })),
        byGovernorate: revenueByGovernorate.map(gov => ({
          governorate: gov.governorate,
          amount: gov._sum.totalAmount || 0
        })),
        byCategory: categoryRevenue,
        dailyPattern: dailyPatterns.map(pattern => ({
          time: pattern.time,
          revenue: Number(pattern.revenue)
        })),
        monthlyPerformance: monthlyPerformance.map(perf => ({
          month: perf.month,
          revenue: Number(perf.revenue),
          orders: Number(perf.orders)
        }))
      },
      topProducts: await Promise.all(
        topProducts.map(async (product) => {
          const details = await this.prisma.product.findUnique({
            where: { id: product.productId }
          });
          return {
            id: product.productId,
            name: details?.name || 'Unknown Product',
            totalSold: product._sum.quantity || 0,
            revenue: product._sum.price || 0,
            currentStock: details?.stock || 0
          };
        })
      )
    };
  }
}
