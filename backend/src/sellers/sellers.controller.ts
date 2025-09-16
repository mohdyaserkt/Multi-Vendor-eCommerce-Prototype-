import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SellerApprovedGuard } from './guards/seller-approved.guard';

@Controller('sellers')
@UseGuards(JwtAuthGuard)
export class SellersController {
  // Get seller profile (only approved sellers can access)
  @UseGuards(SellerApprovedGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return {
      message: 'Seller profile',
      seller: req.seller,
    };
  }

  // Get seller dashboard data (only approved sellers)
  @UseGuards(SellerApprovedGuard)
  @Get('dashboard')
  getDashboard(@Request() req) {
    return {
      message: 'Seller dashboard data',
      seller: req.seller,
    };
  }

  // Get seller orders (only approved sellers)
  @UseGuards(SellerApprovedGuard)
  @Get('orders')
  getOrders(@Request() req) {
    return {
      message: 'Seller orders',
      seller: req.seller,
    };
  }

  // Upload document (only approved sellers)
  @UseGuards(SellerApprovedGuard)
  @Post('documents')
  @UseInterceptors(FileInterceptor('document'))
  uploadDocument(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { message: 'No file uploaded' };
    }
    
    return {
      message: 'Document uploaded successfully',
      filename: file.originalname,
      size: file.size,
    };
  }
}