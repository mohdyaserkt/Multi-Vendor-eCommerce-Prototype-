import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { shippingAddress, pincode, paymentMethod, items } = createOrderDto;

    // If items are not provided, use cart items
    let orderItems = items;
    if (!orderItems || orderItems.length === 0) {
      // Get items from cart
      const cartItems = await this.prisma.cart.findMany({
        where: { userId },
        include: {
          productSeller: {
            include: {
              product: true,
              seller: true,
            },
          },
        },
      });

      if (cartItems.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      orderItems = cartItems.map(item => ({
        productSellerId: item.productSellerId,
        quantity: item.quantity,
      }));
    }

  type ValidatedItem = {
  productSeller: {
    id: string;
    price: number;
    stockQuantity: number;
    product: {
      id: string;
      name: string;
      description: string | null;
    };
    seller: {
      id: string;
      businessName: string;
    };
  };
  quantity: number;
  price: number;
  total: number;
};

let totalAmount = 0;
const validatedItems: ValidatedItem[] = [];

    for (const item of orderItems) {
      const productSeller = await this.prisma.productSeller.findUnique({
        where: {
          id: item.productSellerId,
          isActive: true,
          stockQuantity: {
            gte: item.quantity,
          },
        },
        include: {
          product: true,
          seller: true,
        },
      });

      if (!productSeller) {
        throw new BadRequestException(
          `Product ${item.productSellerId} not available or insufficient stock`,
        );
      }

      const itemTotal = productSeller.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        productSeller,
        quantity: item.quantity,
        price: productSeller.price,
        total: itemTotal,
      });
    }

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create order
    const order = await this.prisma.order.create({
       data:{
        userId,
        orderNumber,
        totalAmount,
        shippingAddress,
        pincode,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    });

    // Create order items
    const orderItemPromises = validatedItems.map(item =>
      this.prisma.orderItem.create({
         data:{
          orderId: order.id,
          productSellerId: item.productSeller.id,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        },
      }),
    );

    await Promise.all(orderItemPromises);

    // Update stock quantities
    const stockUpdatePromises = validatedItems.map(item =>
      this.prisma.productSeller.update({
        where: { id: item.productSeller.id },
         data:{
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      }),
    );

    await Promise.all(stockUpdatePromises);

    // Clear cart if items were from cart
    if (!items || items.length === 0) {
      await this.prisma.cart.deleteMany({
        where: { userId },
      });
    }

    // Add to status history
    await this.prisma.orderStatusHistory.create({
       data:{
        orderId: order.id,
        status: 'PENDING',
        remarks: 'Order created',
      },
    });

    // Return order information
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      paymentMethod: paymentMethod,
      message: 'Order created successfully. Proceed to payment.',
    };
  }

  async getOrders(userId: string, page: number = 1, limit: number = 10) {
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: {
          orderItems: {
            include: {
              productSeller: {
                include: {
                  product: true,
                  seller: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({
        where: { userId },
      }),
    ]);

    return {
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        itemCount: order.orderItems.length,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
        userId,
      },
      include: {
        orderItems: {
          include: {
            productSeller: {
              include: {
                product: true,
                seller: {
                  include: {
                    user: {
                      include: {
                        profile: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Calculate estimated delivery date based on pincode (mock implementation)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3 + Math.floor(Math.random() * 4));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      shippingAddress: order.shippingAddress,
      pincode: order.pincode,
      createdAt: order.createdAt,
      estimatedDelivery,
      items: order.orderItems.map(item => ({
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
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
      statusHistory: order.statusHistory,
    };
  }

  async updateOrderStatus(orderId: string, status: string, paymentStatus?: string) {
    const updateData: any = {
      status: status as any,
    };

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus as any;
    }

    const order = await this.prisma.order.update({
      where: { id: orderId },
       data:updateData,
    });

    // Add to status history
    await this.prisma.orderStatusHistory.create({
       data:{
        orderId: order.id,
        status: status,
        remarks: `Status updated to ${status}`,
      },
    });

    return order;
  }

  async getCartSummary(userId: string) {
    const cartItems = await this.prisma.cart.findMany({
      where: { userId },
      include: {
        productSeller: {
          include: {
            product: true,
            seller: true,
          },
        },
      },
    });

    let totalAmount = 0;
    let totalItems = 0;

    const items = cartItems.map(item => {
      const itemTotal = item.quantity * item.productSeller.price;
      totalAmount += itemTotal;
      totalItems += item.quantity;
      
      return {
        product: {
          id: item.productSeller.product.id,
          name: item.productSeller.product.name,
        },
        seller: {
          businessName: item.productSeller.seller.businessName,
        },
        price: item.productSeller.price,
        quantity: item.quantity,
        total: itemTotal,
      };
    });

    return {
      items,
      totalAmount,
      totalItems,
    };
  }

  // Mock delivery tracking
  async getDeliveryStatus(orderId: string, pincode: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Mock delivery status based on current order status
    const statusMap = {
      'PENDING': { status: 'Order Confirmed', message: 'Your order has been confirmed' },
      'CONFIRMED': { status: 'Packed', message: 'Your order has been packed' },
      'SHIPPED': { status: 'In Transit', message: 'Your order is on the way' },
      'DELIVERED': { status: 'Delivered', message: 'Your order has been delivered' },
      'CANCELLED': { status: 'Cancelled', message: 'Your order has been cancelled' },
    };

    // Calculate estimated delivery date
    const estimatedDelivery = new Date(order.createdAt);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3 + Math.floor(Math.random() * 4));

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      currentStatus: statusMap[order.status] || { status: 'Processing', message: 'Order is being processed' },
      estimatedDelivery,
      trackingUpdates: [
        {
          status: 'Order Placed',
          timestamp: order.createdAt,
          location: 'Order Processing Center',
        },
        ...(order.status !== 'PENDING' ? [{
          status: 'Order Confirmed',
          timestamp: new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000),
          location: 'Warehouse',
        }] : []),
        ...(order.status === 'SHIPPED' || order.status === 'DELIVERED' ? [{
          status: 'Shipped',
          timestamp: new Date(order.createdAt.getTime() + 2 * 24 * 60 * 60 * 1000),
          location: 'Distribution Center',
        }] : []),
        ...(order.status === 'DELIVERED' ? [{
          status: 'Out for Delivery',
          timestamp: new Date(order.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000),
          location: `Local Delivery Center - ${pincode}`,
        }, {
          status: 'Delivered',
          timestamp: new Date(order.createdAt.getTime() + 4 * 24 * 60 * 60 * 1000),
          location: `Delivered to ${pincode}`,
        }] : []),
      ],
    };
  }
}