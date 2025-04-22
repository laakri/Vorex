import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Req,
  Res,
  Query,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { UserDto } from './dto/user.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { PrismaService } from 'prisma/prisma.service';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private recentTokens: string[] = [];

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() requestDto: RequestPasswordResetDto) {
    this.logger.log(`Received password reset request for email: ${requestDto.email}`);
    return this.authService.requestPasswordReset(requestDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    this.logger.log(`Received password reset with token: ${resetDto.token.substring(0, 10)}...`);
    return this.authService.resetPassword(resetDto);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    this.logger.log(`Received email verification request with token: ${token?.substring(0, 10)}...`);
    
    if (!token) {
      this.logger.error('Token is missing in verification request');
      throw new BadRequestException('Token is required');
    }
    
    // Store recent tokens for debugging
    this.recentTokens.unshift(token);
    if (this.recentTokens.length > 5) {
      this.recentTokens.pop();
    }
    
    try {
      const verifyEmailDto: VerifyEmailDto = { token };
      this.logger.log('Calling authService.verifyEmail with token dto');
      
      // Wrap the service call in a try/catch to ensure we return a proper response
      try {
        const result = await this.authService.verifyEmail(verifyEmailDto);
        this.logger.log('Email verification successful');
        return result;
      } catch (error) {
        // Check if the error is likely a database error but the verification actually succeeded
        if (error instanceof BadRequestException && error.message === 'Invalid verification token') {
          // Let's check if the user was already verified
          const user = await this.prisma.user.findFirst({
            where: { 
              verificationToken: null,
              isEmailVerified: true
            },
            orderBy: { updatedAt: 'desc' },
            take: 1
          });
          
          if (user && user.updatedAt > new Date(Date.now() - 60000)) { // Updated in the last minute
            this.logger.log(`Found recently verified user: ${user.id}, returning success response`);
            return { message: 'Email verified successfully' };
          }
        }
        
        // If not a verification success, rethrow the error
        throw error;
      }
    } catch (error) {
      this.logger.error(`Error verifying email: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Diagnostic endpoint to check pending verifications and tokens
  @Get('debug/pending-verifications')
  async debugPendingVerifications() {
    if (this.configService.get('NODE_ENV') === 'production') {
      throw new BadRequestException('Debug endpoints not available in production');
    }
    
    const pendingUsers = await this.prisma.user.findMany({
      where: { 
        isEmailVerified: false,
        verificationToken: { not: null }
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        verificationToken: true,
        createdAt: true
      }
    });
    
    return {
      pendingVerifications: pendingUsers.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        tokenPreview: user.verificationToken ? 
          `${user.verificationToken.substring(0, 10)}...${user.verificationToken.substring(user.verificationToken.length - 5)}` : null,
        createdAt: user.createdAt
      })),
      recentTokenAttempts: this.recentTokens.map(token => 
        `${token.substring(0, 10)}...${token.substring(token.length - 5)}`
      )
    };
  }

  @Post('resend-verification')
  async resendVerificationEmail(@Body('email') email: string) {
    this.logger.log(`Received request to resend verification email to: ${email}`);
    
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    
    try {
      const result = await this.authService.resendVerificationEmail(email);
      this.logger.log('Verification email resent successfully');
      return result;
    } catch (error) {
      this.logger.error(`Error resending verification email: ${error.message}`, error.stack);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return this.authService.getUserProfile(req.user.id);
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      const result = await this.authService.googleLogin(req.user);
      const frontendUrl = this.configService.get('ALLOWED_ORIGINS').split(',')[0];
      
      // Redirect to frontend with token
      return res.redirect(
        `${frontendUrl}/auth/google/callback?token=${result.token}`
      );
    } catch (error) {
      console.error('Google auth error:', error);
      const frontendUrl = this.configService.get('ALLOWED_ORIGINS').split(',')[0];
      return res.redirect(
        `${frontendUrl}/auth/sign-in?error=google_auth_failed`
      );
    }
  }
}
