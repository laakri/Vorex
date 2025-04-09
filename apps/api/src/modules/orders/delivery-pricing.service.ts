import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { DeliveryPricePreview } from './types/delivery-pricing.types';

@Injectable()
export class DeliveryPricingService {
  constructor(private prisma: PrismaService) {}

  async calculateDeliveryPricePreview(
    userId: string,
    items: Array<{
      weight: number;
      dimensions: string;
      quantity: number;
      fragile?: boolean;
      perishable?: boolean;
    }>,
    deliveryGovernorate: string
  ): Promise<DeliveryPricePreview> {
    // Get seller using userId
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: { 
        governorate: true,
        isVerified: true 
      }
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    if (!seller.isVerified) {
      throw new NotFoundException('Seller is not verified');
    }

    // Check if it's local delivery
    const isLocalDelivery = seller.governorate === deliveryGovernorate;

    // Calculate total weight and volume
    const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const totalVolume = items.reduce((sum, item) => {
      const [length, width, height] = item.dimensions.split('x').map(Number);
      return sum + (length * width * height * item.quantity);
    }, 0);

    // Base price based on delivery type
    const basePrice = isLocalDelivery ? 3 : 7;

    // Weight factor (exponential increase)
    const weightFactor = Math.pow(totalWeight / 10, 1.2);
    
    // Volume factor
    const volumeFactor = Math.pow(totalVolume / 1000, 1.1);
    
    // Special handling factors
    const fragileItems = items.filter(item => item.fragile).length;
    const perishableItems = items.filter(item => item.perishable).length;
    const specialHandlingFactor = 1 + (fragileItems * 0.1) + (perishableItems * 0.15);

    // Calculate final price
    let finalPrice = basePrice * weightFactor * volumeFactor * specialHandlingFactor;

    // Apply price caps
    if (isLocalDelivery) {
      finalPrice = Math.min(Math.max(finalPrice, 3), 30);
    } else {
      finalPrice = Math.min(Math.max(finalPrice, 7), 250);
    }

    finalPrice = Math.round(finalPrice * 100) / 100;

    return {
      basePrice,
      weightFactor,
      volumeFactor,
      specialHandlingFactor,
      finalPrice,
      breakdown: {
        weight: totalWeight,
        volume: totalVolume,
        fragileItems,
        perishableItems
      }
    };
  }
}