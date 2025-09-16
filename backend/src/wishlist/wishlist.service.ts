import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async addToWishlist(userId: string, productId: string) {
    // Validate product exists and is active
    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
        isActive: true,
        adminApproved: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found or not available');
    }

    // Check if item already exists in wishlist
    const existingWishlistItem = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingWishlistItem) {
      return existingWishlistItem;
    }

    // Add to wishlist
    const wishlistItem = await this.prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: {
          include: {
            category: true,
            productSellers: {
              where: {
                isActive: true,
                stockQuantity: { gt: 0 },
              },
              orderBy: {
                price: 'asc',
              },
              take: 1,
              include: {
                seller: true,
              },
            },
          },
        },
      },
    });

    return wishlistItem;
  }

  async getWishlist(userId: string) {
    const wishlistItems = await this.prisma.wishlist.findMany({
      where: {
        userId,
      },
      include: {
        product: {
          include: {
            category: true,
            productSellers: {
              where: {
                isActive: true,
                stockQuantity: { gt: 0 },
              },
              orderBy: {
                price: 'asc',
              },
              take: 1,
              include: {
                seller: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const items = wishlistItems.map(item => ({
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        category: item.product.category,
        price: item.product.productSellers[0]?.price || 0,
        seller: item.product.productSellers[0]?.seller || null,
      },
      addedAt: item.createdAt,
    }));

    return {
      items,
      totalItems: items.length,
    };
  }

  async removeFromWishlist(userId: string, wishlistItemId: string) {
    // Validate wishlist item belongs to user
    const wishlistItem = await this.prisma.wishlist.findUnique({
      where: {
        id: wishlistItemId,
        userId,
      },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Wishlist item not found');
    }

    // Remove from wishlist
    await this.prisma.wishlist.delete({
      where: {
        id: wishlistItemId,
      },
    });

    return { message: 'Item removed from wishlist successfully' };
  }

  async removeProductFromWishlist(userId: string, productId: string) {
    // Remove specific product from wishlist
    const wishlistItem = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Product not found in wishlist');
    }

    await this.prisma.wishlist.delete({
      where: {
        id: wishlistItem.id,
      },
    });

    return { message: 'Product removed from wishlist successfully' };
  }

  async clearWishlist(userId: string) {
    await this.prisma.wishlist.deleteMany({
      where: {
        userId,
      },
    });

    return { message: 'Wishlist cleared successfully' };
  }

  async isInWishlist(userId: string, productId: string) {
    const wishlistItem = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return { isInWishlist: !!wishlistItem };
  }
}