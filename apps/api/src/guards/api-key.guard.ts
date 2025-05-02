import { SellerApiService } from '@/modules/seller-api/seller-api.service';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly sellerApiService: SellerApiService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('API key missing');
    }
    try {
      await this.sellerApiService.validateApiKey(apiKey);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid API key');
    }
  }
}