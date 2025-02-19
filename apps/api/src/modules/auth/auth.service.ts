import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';
import { Role } from '@/common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
        role: Role.SELLER,
        isVerifiedSeller: false,
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

    return {
      user,
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        fullName: true,
        password: true,
        role: true,
        isVerifiedSeller: true,
        isVerifiedDriver: true,
        isVerifiedAdmin: true,
        isVerifiedWarehouse: true,  
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get all verified roles
    const verifiedRoles: Role[] = [];
    if (user.isVerifiedSeller) verifiedRoles.push(Role.SELLER);
    if (user.isVerifiedDriver) verifiedRoles.push(Role.DRIVER);
    if (user.isVerifiedAdmin) verifiedRoles.push(Role.ADMIN);
    if (user.isVerifiedWarehouse) verifiedRoles.push(Role.WAREHOUSE_MANAGER);

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      verifiedRoles,
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: {
        ...userWithoutPassword,
        verifiedRoles,
        hasMultipleRoles: verifiedRoles.length > 1,
      },
      token,
    };
  }

  private generateToken(payload: any) {
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
}
