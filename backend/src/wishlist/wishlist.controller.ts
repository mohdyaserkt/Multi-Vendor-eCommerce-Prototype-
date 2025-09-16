import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(@Request() req) {
    return this.wishlistService.getWishlist(req.user.userId);
  }

  @Post()
  addToWishlist(@Request() req, @Body() addToWishlistDto: AddToWishlistDto) {
    return this.wishlistService.addToWishlist(
      req.user.userId,
      addToWishlistDto.productId,
    );
  }

  @Delete(':id')
  removeFromWishlist(@Request() req, @Param('id') id: string) {
    return this.wishlistService.removeFromWishlist(req.user.userId, id);
  }

  @Delete('product/:productId')
  removeProductFromWishlist(
    @Request() req,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.removeProductFromWishlist(
      req.user.userId,
      productId,
    );
  }

  @Delete()
  clearWishlist(@Request() req) {
    return this.wishlistService.clearWishlist(req.user.userId);
  }

  @Get('check/:productId')
  isInWishlist(
    @Request() req,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.isInWishlist(req.user.userId, productId);
  }
}