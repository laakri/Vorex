import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';
import { Role } from '@/common/enums/role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';


@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        fullName: dto.fullName,
        role: [Role.SELLER],
        isVerifiedSeller: false,
        isVerifiedDriver: false,
        isEmailVerified: false,
        verificationToken,
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

    // Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      user.fullName,
      verificationToken
    );

    const token = this.generateToken(user);

    // Create a notification
    const notification = await this.notificationsService.createNotification(
      user.id,
      'INFO', // or another enum value from NotificationTypeValues
      'Welcome!',
      `Hello ${user.fullName}, welcome to our platform! Please verify your email to continue.`
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
        isEmailVerified: true,
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

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
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
        isEmailVerified: true,
        warehouseManager: {
          select: {
            id: true,
            warehouseId: true,
          }
        },
      },
    });

    // For Google login, we can auto-verify their email
    if (userProfile && !userProfile.isEmailVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true }
      });
    }

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
        isEmailVerified: true,
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
      isEmailVerified: user.isEmailVerified,
      warehouseId: user.warehouseManager?.warehouseId || null,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: dto.token }
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
      }
    });

    // Create a notification
    await this.notificationsService.createNotification(
      user.id,
      'SUCCESS',
      'Email Verified',
      'Your email has been successfully verified. You can now use all features of our platform.'
    );

    return { message: 'Email verified successfully' };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (!user) {
      // For security reasons, don't reveal that the email doesn't exist
      return { message: 'If your email is registered, you will receive a password reset link' };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // Token expires in 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      }
    });

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.fullName,
      resetToken
    );

    return { message: 'If your email is registered, you will receive a password reset link' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: dto.token,
        resetPasswordExpires: {
          gt: new Date(), // Token must not be expired
        }
      }
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      }
    });

    // Create a notification
    await this.notificationsService.createNotification(
      user.id,
      'SUCCESS',
      'Password Reset',
      'Your password has been successfully reset. You can now log in with your new password.'
    );

    return { message: 'Password reset successful' };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // For security reasons, don't reveal that the email doesn't exist
      return { message: 'If your email is registered, you will receive a verification link' };
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    // Generate new verification token
    const verificationToken = randomBytes(32).toString('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationToken }
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      user.fullName,
      verificationToken
    );

    return { message: 'Verification email has been sent' };
  }
}
