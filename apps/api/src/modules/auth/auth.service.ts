import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';
import { Role } from '@/common/enums/role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';


@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        fullName: dto.fullName,
        role: [Role.SELLER],
        isVerifiedSeller: false,
        isVerifiedDriver: false,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isVerifiedSeller: true,
        createdAt: true,
      },
    });

    const token = this.generateToken(user);

      // Create a notification
      const notification = await this.notificationsService.createNotification(
        user.id,
        'INFO', // or another enum value from NotificationTypeValues
        'Welcome!',
        `Hello ${user.fullName}, welcome to our platform! 🎉`
      );

      // Emit the notification via socket
      this.notificationsGateway.sendNotificationToUser(user.id, notification);

    return {
      user,
      token,
    };
  }

  async login(dto: LoginDto) {
    console.log('Login attempt for email:', dto.email);
    
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        password: true,
        isVerifiedSeller: true,
        isVerifiedDriver: true,
        warehouseManager: {
          select: {
            id: true,
            warehouseId: true,
          }
        },
      },
    });

    console.log('User found:', user ? 'yes' : 'no');

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerifiedSeller: user.isVerifiedSeller,
        isVerifiedDriver: user.isVerifiedDriver,
        warehouseId: user.warehouseManager?.warehouseId || null,
      },
      token,
    };
  }

  private generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }

    return null;
  }

  async googleLogin(user: any) {
    if (!user) {
      throw new UnauthorizedException('No user from Google');
    }

    // Fetch the complete user profile including warehouseManager
    const userProfile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isVerifiedSeller: true,
        isVerifiedDriver: true,
        warehouseManager: {
          select: {
            id: true,
            warehouseId: true,
          }
        },
      },
    });

    // Use same token generation as regular login
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

      // Create a notification
      const notification = await this.notificationsService.createNotification(
        user.id,
        'INFO', // or another enum value from NotificationTypeValues
        'Welcome!',
        `Hello ${user.fullName}, welcome to our platform! 🎉`
      );

      // Emit the notification via socket
      this.notificationsGateway.sendNotificationToUser(user.id, notification);

    return {
      user: {
        id: userProfile?.id,
        email: userProfile?.email,
        fullName: userProfile?.fullName,
        role: userProfile?.role,
        isVerifiedSeller: userProfile?.isVerifiedSeller,
        isVerifiedDriver: userProfile?.isVerifiedDriver,
        warehouseId: userProfile?.warehouseManager?.warehouseId || null,
      },
      token,
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isVerifiedSeller: true,
        isVerifiedDriver: true,
        warehouseManager: {
          select: {
            id: true,
            warehouseId: true,
          }
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isVerifiedSeller: user.isVerifiedSeller,
      isVerifiedDriver: user.isVerifiedDriver,
      warehouseId: user.warehouseManager?.warehouseId || null,
    };
  }
}
