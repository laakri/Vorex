import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, StrategyOptions } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { Role } from '@/common/enums/role.enum';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const options: StrategyOptions = {
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
    };

    super(options);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<any> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new UnauthorizedException('No email provided from Google');
    }

    const firstName = profile.name?.givenName || '';
    const lastName = profile.name?.familyName || '';
    
    // Find existing user by email
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        seller: true // Include seller info if exists
      }
    });

    if (user) {
      // Update existing user with Google info if needed
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: user.fullName || `${firstName} ${lastName}`.trim(),
          // Don't override existing password if user has one
          password: user.password || ''
        },
        include: {
          seller: true
        }
      });
    } else {
      // Create new user if doesn't exist
      user = await this.prisma.user.create({
        data: {
          email,
          fullName: `${firstName} ${lastName}`.trim(),
          password: '', 
          role: Role.SELLER,
        },
        include: {
          seller: true
        }
      });
    }

    return {
      ...user,
      isVerifiedSeller: !!user.seller
    };
  }
} 