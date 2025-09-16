import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SellerApprovedGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Only apply to sellers
    if (user.role !== 'SELLER') {
      return true;
    }

    // Check if seller is approved
    const seller = await this.prisma.seller.findUnique({
      where: { userId: user.userId },
    });

    if (!seller) {
      throw new UnauthorizedException('Seller profile not found');
    }

    if (seller.status !== 'APPROVED') {
      throw new UnauthorizedException('Seller account pending approval. Please contact administrator.');
    }

    // Attach seller info to request for later use
    request.seller = seller;
    return true;
  }
}