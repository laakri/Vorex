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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
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

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return req.user;
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
