import { Module } from '@nestjs/common';
import { SellersController } from './sellers.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SellerApprovedGuard } from './guards/seller-approved.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SellersController],
  providers: [SellerApprovedGuard],
  exports: [SellerApprovedGuard],
})
export class SellersModule {}