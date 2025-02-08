import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
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
}
