import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import { Role } from '@/common/enums/role.enum';

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
}
