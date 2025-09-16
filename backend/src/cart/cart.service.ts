import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async addToCart(userId: string, productSellerId: string, quantity: number) {
    // Validate product seller exists and is available
    const productSeller = await this.prisma.productSeller.findUnique({
      where: {
        id: productSellerId,
        isActive: true,
        stockQuantity: {
          gte: quantity,
        },
      },
      include: {
        product: true,
        seller: true,
      },
    });

    if (!productSeller) {
      throw new BadRequestException('Product not available or insufficient stock');
    }

    // Check if item already exists in cart
    const existingCartItem = await this.prisma.cart.findUnique({
      where: {
        userId_productSellerId: {
          userId,
          productSellerId,
        },
      },
    });

    if (existingCartItem) {
      // Update existing cart item
      const updatedCartItem = await this.prisma.cart.update({
        where: {
          id: existingCartItem.id,
        },
        data: {
          quantity: existingCartItem.quantity + quantity,
        },
        include: {
          productSeller: {
            include: {
              product: true,
              seller: true,
            },
          },
        },
      });

      return updatedCartItem;
    } else {
      // Create new cart item
      const cartItem = await this.prisma.cart.create({
        data: {
          userId,
          productSellerId,
          quantity,
        },
        include: {
          productSeller: {
            include: {
              product: true,
              seller: true,
            },
          },
        },
      });

      return cartItem;
    }
  }

  async getCart(userId: string) {
    const cartItems = await this.prisma.cart.findMany({
      where: {
        userId,
      },
      include: {
        productSeller: {
          include: {
            product: true,
            seller: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate cart totals
    let cartTotal = 0;
    let totalItems = 0;

    const items = cartItems.map(item => {
      const itemTotal = item.quantity * item.productSeller.price;
      cartTotal += itemTotal;
      totalItems += item.quantity;
      
      return {
        id: item.id,
        product: {
          id: item.productSeller.product.id,
          name: item.productSeller.product.name,
          description: item.productSeller.product.description,
        },
        seller: {
          id: item.productSeller.seller.id,
          businessName: item.productSeller.seller.businessName,
        },
        price: item.productSeller.price,
        quantity: item.quantity,
        total: itemTotal,
        createdAt: item.createdAt,
      };
    });

    return {
      items,
      cartTotal,
      totalItems,
    };
  }

  async updateCartItem(userId: string, cartItemId: string, quantity: number) {
    // Validate cart item belongs to user
    const cartItem = await this.prisma.cart.findUnique({
      where: {
        id: cartItemId,
        userId,
      },
      include: {
        productSeller: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Check stock availability
    if (quantity > cartItem.productSeller.stockQuantity) {
      throw new BadRequestException('Insufficient stock available');
    }

    // Update cart item
    const updatedCartItem = await this.prisma.cart.update({
      where: {
        id: cartItemId,
      },
      data: {
        quantity,
      },
      include: {
        productSeller: {
          include: {
            product: true,
            seller: true,
          },
        },
      },
    });

    return updatedCartItem;
  }

  async removeFromCart(userId: string, cartItemId: string) {
    // Validate cart item belongs to user
    const cartItem = await this.prisma.cart.findUnique({
      where: {
        id: cartItemId,
        userId,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Delete cart item
    await this.prisma.cart.delete({
      where: {
        id: cartItemId,
      },
    });

    return { message: 'Item removed from cart successfully' };
  }

  async clearCart(userId: string) {
    await this.prisma.cart.deleteMany({
      where: {
        userId,
      },
    });

    return { message: 'Cart cleared successfully' };
  }

  // Get cart item count for user
  async getCartItemCount(userId: string) {
    const count = await this.prisma.cart.count({
      where: {
        userId,
      },
    });

    return { count };
  }
}