import {
    Controller,
    Get,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
  } from '@nestjs/common';
  import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
  
  @Controller('notifications')
  @UseGuards(JwtAuthGuard)
  export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}
  
    @Get()
    async getNotifications(
      @Request() req,
      @Query('skip') skip?: string,
      @Query('take') take?: string,
      @Query('includeRead') includeRead?: string,
    ) {
      const userId = req.user.id;
      return this.notificationsService.getUserNotifications(
        userId,
        skip ? parseInt(skip) : 0,
        take ? parseInt(take) : 10,
        includeRead === 'true',
      );
    }
  
    @Get('count')
    async getNotificationCount(
      @Request() req,
      @Query('onlyUnread') onlyUnread?: string,
    ) {
      const userId = req.user.id;
      const count = await this.notificationsService.getNotificationCount(
        userId,
        onlyUnread !== 'false',
      );
      return { count };
    }
  
    @Patch(':id/read')
    async markAsRead(@Param('id') id: string) {
      return this.notificationsService.markAsRead(id);
    }
  
    @Patch('read-all')
    async markAllAsRead(@Request() req) {
      const userId = req.user.id;
      return this.notificationsService.markAllAsRead(userId);
    }
  
    @Delete(':id')
    async deleteNotification(@Param('id') id: string) {
      await this.notificationsService.deleteNotification(id);
      return { success: true };
    }
  }