import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SellerApprovedGuard } from '../sellers/guards/seller-approved.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Public: Get all products with filters
  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  // Public: Get product by ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // Seller: Create product (only approved sellers)
  @UseGuards(JwtAuthGuard, SellerApprovedGuard)
  @Post()
  create(@Request() req, @Body() createProductDto: CreateProductDto) {
    return this.productsService.create(req.user.userId, createProductDto);
  }

  // Seller: Get own products (only approved sellers)
  @UseGuards(JwtAuthGuard, SellerApprovedGuard)
  @Get('seller/my-products')
  findSellerProducts(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.findSellerProducts(
      req.user.userId,
      page,
      limit,
    );
  }

  // Seller: Update own product (only approved sellers)
  @UseGuards(JwtAuthGuard, SellerApprovedGuard)
  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(req.user.userId, id, updateProductDto);
  }

  // Seller: Delete own product (only approved sellers)
  @UseGuards(JwtAuthGuard, SellerApprovedGuard)
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.productsService.remove(req.user.userId, id);
  }

  // Admin: Get all products for approval
  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  findAllForAdmin(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('approved') approved?: boolean,
  ) {
    // In production, add role check here
    return this.productsService.findAllForAdmin(page, limit, approved);
  }

  // Admin: Approve product
  @UseGuards(JwtAuthGuard)
  @Post('admin/:id/approve')
  approveProduct(@Request() req, @Param('id') id: string) {
    // In production, add role check here
    return this.productsService.approveProduct(id);
  }

  // Admin: Reject product
  @UseGuards(JwtAuthGuard)
  @Post('admin/:id/reject')
  rejectProduct(@Request() req, @Param('id') id: string) {
    // In production, add role check here
    return this.productsService.rejectProduct(id);
  }
}