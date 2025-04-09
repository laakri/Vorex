export interface DeliveryPricePreview {
    basePrice: number;
    weightFactor: number;
    volumeFactor: number;
    specialHandlingFactor: number;
    finalPrice: number;
    breakdown: {
      weight: number;
      volume: number;
      fragileItems: number;
      perishableItems: number;
    };
  }