import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Put,
  Delete,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SellerDashboardService } from './seller-dashboard.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DocumentType } from './dto/upload-document.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SellerApprovedGuard } from '../sellers/guards/seller-approved.guard';

@Controller('seller')
@UseGuards(JwtAuthGuard, SellerApprovedGuard)
export class SellerDashboardController {
  constructor(private readonly sellerDashboardService: SellerDashboardService) {}

  @Get('dashboard')
  getDashboard(@Request() req) {
    return this.sellerDashboardService.getDashboardStats(req.seller.id);
  }

  @Get('products')
  getProducts(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.sellerDashboardService.getProducts(
      req.seller.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  @Get('orders')
  getOrders(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.sellerDashboardService.getOrders(
      req.seller.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      status,
    );
  }

  @Get('orders/:id')
  getOrderDetails(@Request() req, @Param('id') id: string) {
    return this.sellerDashboardService.getOrderDetails(req.seller.id, id);
  }

  @Post('orders/:id/status')
  updateOrderStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() statusDto: { status: string },
  ) {
    return this.sellerDashboardService.updateOrderStatus(
      req.seller.id,
      id,
      statusDto.status,
    );
  }

  @Get('profile')
  getProfile(@Request() req) {
    return this.sellerDashboardService.getProfile(req.seller.id);
  }

  @Put('profile')
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.sellerDashboardService.updateProfile(req.seller.id, updateProfileDto);
  }

  @Post('documents')
  @UseInterceptors(FileInterceptor('document'))
  uploadDocument(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: DocumentType,
  ) {
    return this.sellerDashboardService.uploadDocument(req.seller.id, file, documentType);
  }

  @Delete('documents/:id')
  deleteDocument(@Request() req, @Param('id') id: string) {
    return this.sellerDashboardService.deleteDocument(req.seller.id, id);
  }

  @Get('reports/sales')
  getSalesReport(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.sellerDashboardService.getSalesReport(
      req.seller.id,
      startDate,
      endDate,
    );
  }
}