import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationTypeValues } from './types/notification-types';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(
    userId: string,
    type: NotificationTypeValues,
    title: string,
    message: string,
    data?: any,
    orderId?: string,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? data : null,
        orderId,
      },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { count: result.count };
  }

  async getUserNotifications(
    userId: string,
    skip = 0,
    take = 10,
    includeRead = false,
  ) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(includeRead ? {} : { isRead: false }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
      include: {
        order: {
          select: {
            id: true,
            status: true,
            customerName: true,
            totalAmount: true,
          },
        },
      },
    });
  }

  async getNotificationCount(userId: string, onlyUnread = true) {
    return this.prisma.notification.count({
      where: {
        userId,
        ...(onlyUnread ? { isRead: false } : {}),
      },
    });
  }

  async deleteNotification(id: string) {
    await this.prisma.notification.delete({
      where: { id },
    });
  }
}